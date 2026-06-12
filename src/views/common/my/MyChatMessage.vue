<script setup lang="ts">
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  ref
} from "vue";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.js";
import {
  type ContactItem,
  type IdNameValueMetadata,
  type PageResult,
  type PlatformUser,
  type RestResult,
  type UserChatConversationEntity,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity,
  type UserChatMessageResponseBody
} from "@/types/apis";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {AuthServerService} from "@/apis";
import {usePrincipalStore} from "@/stores/principalStore";
import LChatConversation from "@/components/chat/ChatConversation.vue";
import LChatContact from "@/components/chat/ChatContact.vue";
import LChatView from "@/components/chat/ChatView.vue";
import type {
  ChatBubbleItem,
  ConversationActiveProps,
  ServerConversationItem
} from "@/types/composables";
import {useSocketStore} from "@/stores/socketStore.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {DEFAULT_PAGE_RESULT_VALUE} from "@/constants/systemConstant.ts";
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import LChatRoomView from "@/components/chat/ChatRoomView.vue";

defineOptions({
  name: 'MyChatMessageHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()
const socketStore = useSocketStore()
const messageServerStore = useMessageServerStore()

const segmented = ref<{
  value: string
  data: Record<string, unknown>[]
}>({
  value: 'conversation',
  data: [{
    value: 'conversation',
    iconText: 'loncra-message-square-more'
  }, {
    value: 'contact',
    iconText: 'loncra-contact'
  }]
})

const options = ref<{
  conversationDataSource: UserChatConversationResponseBody[]
  contactDataSource: ContactItem[]
  loading: boolean
  searchValue:string
}>({
  conversationDataSource: [],
  contactDataSource: [],
  searchValue:'',
  loading: false
})

const conversationActive = ref<ConversationActiveProps>({
  item: undefined,
  loading: false,
  sending: false,
  dataSource: DEFAULT_PAGE_RESULT_VALUE,
  drawerOpen:false,
  bubbleList: []
})

const chatViewRef = ref<typeof LChatView>()
const conversationRef = ref<typeof LChatConversation>()
const socketListener = ref<((() => void) | undefined)[]>([])

async function loadConversationData(
  chatRoomId: number,
  number:number
) {

  if (conversationActive.value.loading) {
    return ;
  }

  conversationActive.value.loading = true
  try {
    const result:RestResult<PageResult<UserChatMessageResponseBody>> = await ChatMessageService.histories({number}, chatRoomId)

    conversationActive.value.dataSource = result?.data || DEFAULT_PAGE_RESULT_VALUE
    const elements = conversationActive.value.dataSource.elements || []
    for (const d of elements) {
      let role:ChatBubbleItem["role"] = principalStore.state.name === (d.participant?.metadata?.details as {systemName:string})?.systemName ? 'user' : 'ai'
      if (getEnumValue(d.type) === 20) {
        role = 'system'
      }
      ChatMessageService.addBubbleListMessage(d, role, conversationActive.value.bubbleList)
    }

  } finally {
    conversationActive.value.loading = false
  }
}

async function onSendMessage(entity: UserChatMessageEntity) {

  const find = options.value.conversationDataSource.find(d => d.room.id === entity.chatRoomId)
  if (!find) {
    return
  }
  options.value.conversationDataSource = options.value.conversationDataSource.filter(d => d.room.id !== entity.chatRoomId)
  find.lastUserMessage = entity
  options.value.conversationDataSource = [
    find,
    ...options.value.conversationDataSource,
  ]
}

async function onContactSelected(value: UserChatConversationResponseBody) {
  let find = options.value.conversationDataSource.find(d => d.id === value.id)
  if (find) {
    options.value.conversationDataSource = options.value.conversationDataSource.filter(d => d.id !== value.id)
  } else {
    find = value
  }
  options.value.conversationDataSource = [
    find,
    ...options.value.conversationDataSource,
  ]
  segmented.value.value = 'conversation'
  await setActiveConversationItemByEntity(find)
}

async function onConversationsChange(conversationItem:ServerConversationItem) {
  if (conversationActive.value.loading) {
    return;
  }
  if (conversationActive.value?.item?.key === conversationItem.key) {
    conversationActive.value.item = conversationItem
    return
  }
  conversationActive.value.item = conversationItem
  conversationActive.value.bubbleList = []
  await loadConversationData(Number(conversationActive.value.item?.data?.room?.id),1)
  await nextTick()
  requestAnimationFrame(() => chatViewRef.value?.scrollTo({ top: "bottom", behavior: "smooth" }));
}

async function onConversationRefreshByRoomId(result:RestResult<number>) {
  if (!result.data) {
    return
  }
  const index = options.value.conversationDataSource.findIndex(s => s.room.id === result.data)
  if (index < 0) {
    return
  }
  const conversationResult:RestResult<UserChatConversationEntity | UserChatConversationResponseBody> = await ChatMessageService.getConversation(result.data, true)

  if (!conversationResult.data) {
    return
  }
  options.value.conversationDataSource[index] = conversationResult.data as UserChatConversationResponseBody
  const find = options.value.conversationDataSource[index];
  if (!conversationActive.value.item || !conversationActive.value.item?.data) {
    return
  }
  if (conversationActive.value.item?.data?.room?.id === result.data) {
    conversationActive.value.item = {
      label:find.name,
      key:String(find.id),
      data:find
    }

    conversationRef.value?.changeMessageExtraContent(conversationActive.value.item)
  }
}

async function onConversationRefresh() {
  const chatRoomResult: RestResult<UserChatConversationResponseBody[]> = await ChatMessageService.my()
  if (chatRoomResult.data) {
    options.value.conversationDataSource = [...chatRoomResult.data]
  }

  if (!conversationActive.value.item) {
    return
  }

  const find = options.value.conversationDataSource.find(c => c.id === conversationActive.value.item?.data?.id)
  await setActiveConversationItemByEntity(find)
}

async function mounted() {
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE,
    (payload) => onChatMessageReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload))
  ))
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_CONVERSATION_CREATE,
    (payload) => onChatConversationReceived(parseSocketRestPayload<UserChatConversationResponseBody>(payload))
  ))

  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID,
    (payload) => onConversationRefreshByRoomId(parseSocketRestPayload<number>(payload))
  ))

  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH,
    () => onConversationRefresh()
  ))

  options.value.loading = true
  try {
    await onConversationRefresh()
    const contactResult: RestResult<IdNameValueMetadata<PlatformUser[]>[]> = await AuthServerService.systemUsers({number: -1}, true, false)
    if (contactResult.data) {
      const list: ContactItem[] = []
      for (const r of contactResult.data) {
        r.value.forEach((v) => list.push({
          key: String(v.id),
          label: v.realName || v.username,
          group: r.name,
          disabled: principalStore.state.name === v.systemName,
          data: v,
        }))
      }
      options.value.contactDataSource = [...list]
    }
  } finally {
    options.value.loading = false
  }
  await nextTick()
  const find = options.value.conversationDataSource.find(d => d.id === Number(globalProperties.$route.query.conversationId))
  if (find) {
    await setActiveConversationItemByEntity(find)
  }
}

function onConversationDelete(body:UserChatConversationResponseBody) {
  options.value.conversationDataSource = options.value.conversationDataSource.filter(d => d.id !== body.id)

  if (!conversationActive.value.item) {
    return
  }
  if (conversationActive.value.item?.data?.id === body.id) {
    setActiveConversationItemByEntity(undefined)
  }
}

async function setActiveConversationItemByEntity(body:UserChatConversationResponseBody | undefined) {
  if (body) {
    const activeConversationItem:ServerConversationItem = {
      key: String(body.id),
      label: body.name,
      data: body,
    }
    await setActiveConversationItem(activeConversationItem)
  } else {
    conversationActive.value.item = undefined
    if (conversationRef.value) {
      conversationRef.value?.changeMessageExtraContent(undefined)
    }
  }
}

async function setActiveConversationItem(activeConversationItem:ServerConversationItem) {
  await onConversationsChange(activeConversationItem)
  if (conversationRef.value) {
    conversationRef.value?.changeMessageExtraContent(conversationActive.value.item)
  }
}

async function onChatMessageReceived(result: RestResult<UserChatMessageResponseBody | UserChatMessageEntity>) {
  if (!result.data || result.data.principal === principalStore.state.name) {
    return
  }

  if (conversationActive.value.item?.data?.room?.id === result.data.chatRoomId && chatViewRef.value) {
    const role = getEnumValue(result.data.type) === 20 ? 'system' : 'ai';
    ChatMessageService.addBubbleListMessage(result.data, role, conversationActive.value.bubbleList)
  }

  await onSendMessage(result.data)
}

function onChatConversationReceived(result: RestResult<UserChatConversationResponseBody>) {
  if (!result.data) {
    return
  }
  messageServerStore.fetchUnreadQuantity()
  const ids = options.value.conversationDataSource.map(c => c.id)
  if (ids.includes(result.data.id)) {
    return
  }
  options.value.conversationDataSource.unshift(result.data)
}

async function onChatViewNextPage() {
  const roomId = Number(conversationActive.value.item?.data?.room?.id)
  if (!roomId) {
    return
  }
  // 锚点：当前已加载的最旧一条消息（加载后它会被新内容顶到下面）
  const bubbles = conversationActive.value.bubbleList
  const anchor = bubbles.length
    ? bubbles.reduce((a, b) =>
      (a.data?.creationTime ?? 0) <= (b.data?.creationTime ?? 0) ? a : b)
    : undefined
  await loadConversationData(roomId, conversationActive.value.dataSource.number + 1)
  await nextTick()
  if (anchor) {
    // behavior 必须用 'auto'（即 instant），否则平滑动画会很怪
    chatViewRef.value?.scrollTo({ key: anchor.key, behavior: 'auto', block: 'start' })
  }
  if (conversationActive.value.dataSource.last) {
    conversationActive.value.bubbleList.unshift({
      key:globalProperties.$dayjs().unix(),
      role:'system',
      content:'没有更多的数据了'
    })
  }
}

function onConversationMoreClick() {
  conversationActive.value.drawerOpen = !conversationActive.value.drawerOpen;
}

async function onAddParticipant(user:ContactItem[], restResult:RestResult<UserChatConversationResponseBody>) {
  if (!restResult.data) {
    return ;
  }
  await setActiveConversationItemByEntity(restResult.data)
}

onUnmounted(() => socketListener.value.forEach(f => f?.()));

onMounted(mounted)
</script>

<template>
  <div class="h-full min-h-0">
    <a-splitter class="h-full min-h-0">
      <a-splitter-panel class="h-full p-0 overflow-hiddenl" default-size="20%" min="15%" max="25%">
        <a-spin :spinning="options.loading" class="size-full-spin">
          <a-flex vertical class="size-full min-h-0">

            <l-chat-conversation
              ref="conversationRef"
              @delete="onConversationDelete"
              @change="onConversationsChange"
              :active-key="conversationActive?.item?.key"
              v-model:data-source="options.conversationDataSource"
              v-if="segmented.value === 'conversation'"
              @more-click="onConversationMoreClick"
            />
            <l-chat-contact
              @selected="onContactSelected"
              v-model:loading="options.loading"
              v-else-if="segmented.value === 'contact'"
              v-model:data-source="options.contactDataSource"
            />
            <div class="shrink-0 p-xs bg-layout -ml-1px">
              <a-segmented v-model:value="segmented.value" block :options="segmented.data"
                           @change="(key:string )=> segmented.value = key ">
                <template #iconRender="{ iconText }">
                  <icon-font class="icon align" :type="iconText"/>
                </template>
              </a-segmented>
            </div>
          </a-flex>
        </a-spin>
      </a-splitter-panel>
      <a-splitter-panel class="h-full min-h-0 overflow-hidden">
        <div class="h-full min-h-0 overflow-hidden relative" v-if="conversationActive.item">
          <l-chat-view
            @next-page="onChatViewNextPage"
            ref="chatViewRef"
            v-model:conversation="conversationActive"
            @send="onSendMessage"
          />
          <a-drawer
            v-if="conversationActive.item.data"
            v-model:open="conversationActive.drawerOpen"
            placement="right"
            :get-container="false"
            :closable="false"
            :mask="false"
            @close="conversationActive.drawerOpen = false"
          >
            <l-chat-room-view
              @delete-conversation="onConversationDelete"
              @add-participant="onAddParticipant"
              :contact-data-source="options.contactDataSource"
              v-model:conversation="conversationActive.item.data" />
          </a-drawer>
        </div>
        <a-flex v-else vertical class="size-full" justify="center" align="center">
          <a-empty/>
        </a-flex>
      </a-splitter-panel>
    </a-splitter>
  </div>
</template>
