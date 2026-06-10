<script setup lang="ts">
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  ref
} from "vue";
import {ChatMessageService} from "@/apis/message-server/chat/chatMessageService.ts";
import {
  type ContactItem,
  type IdNameValueMetadata,
  type IdValueMetadata,
  type PageResult,
  type PlatformUser,
  type RestResult,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity,
  type UserChatMessageResponseBody
} from "@/types/apis";
import {findAllTreeNodes, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {AuthServerService} from "@/apis";
import {usePrincipalStore} from "@/stores/principalStore";
import LChatConversation from "@/components/chat/ChatConversation.vue";
import LChatContact from "@/components/chat/ChatContact.vue";
import LChatView from "@/components/chat/ChatView.vue";
import type {
  ChatBubbleItem,
  ChatContentBlock,
  ConversationActiveProps,
  ServerConversationItem,
  TextBlock
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
  loadConversationDataSource: UserChatConversationResponseBody[]
  loadContactDataSource: ContactItem[]
  loading: boolean
  searchValue:string
}>({
  conversationDataSource: [],
  contactDataSource: [],
  loadConversationDataSource: [],
  loadContactDataSource: [],
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
  number:number,
  prepend: boolean = true,
) {

  if (conversationActive.value.loading) {
    return ;
  }

  conversationActive.value.loading = true
  try {
    const result:RestResult<PageResult<UserChatMessageResponseBody>> = await ChatMessageService.histories({number}, chatRoomId)

    conversationActive.value.dataSource = result?.data || DEFAULT_PAGE_RESULT_VALUE
    const bubbleItems: ChatBubbleItem[] = []
    const elements = conversationActive.value.dataSource.elements || []
    for (const d of elements) {
      if (getEnumValue(d.type) === 20) {
        bubbleItems.push({
          key: String(d.id),
          role: 'system',
          content: d.content.map(c => ((c as TextBlock).value as unknown as ChatContentBlock)),
          data:d
        })
      } else {
        bubbleItems.push({
          key: String(d.id),
          role: principalStore.state.name === (d.participant?.metadata?.details as {systemName:string})?.systemName ? 'user' : 'ai',
          content: d.content,
          data:d
        })
      }
    }
    if (prepend) {
      conversationActive.value.bubbleList = [...bubbleItems,...conversationActive.value.bubbleList]
      if (conversationActive.value.dataSource.last) {
        conversationActive.value.bubbleList.unshift({
          key: 'system-unread-hint',        // 唯一 key
          role: 'system',                   // 关键：必须是 'system'
          content: '没有更多记录了',              // 显示文案，也可传 VNode
        })
      }
    } else {
      conversationActive.value.bubbleList = bubbleItems
    }
    await nextTick()
    const messageIds:number[] = elements.filter(e => getEnumValue(e.readable) === 1)
      .map(e => Number(e.id))
    if (messageIds.length > 0) {
      await ChatMessageService.read(messageIds)
      await messageServerStore.fetchUnreadQuantity()
    }
  } finally {
    conversationActive.value.loading = false
  }
}

async function onSendMessage(entity: UserChatMessageEntity, fetchUnreadQuantity:boolean = false) {

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
  options.value
    .conversationDataSource
    .sort((a, b) => globalProperties
      .$dayjs(b.lastUserMessage?.creationTime)
      .diff(globalProperties.$dayjs(a.lastUserMessage?.creationTime))
    )
  if (fetchUnreadQuantity) {
    await messageServerStore.fetchUnreadQuantity()
  }
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
  options.value.loadConversationDataSource = [
    find,
    ...options.value.loadConversationDataSource,
  ]
  segmented.value.value = 'conversation'
  const activeConversationItem:ServerConversationItem = {
    key: String(find.id),
    label: find.name,
    data: find,
  }
  await onConversationsChange(activeConversationItem)
  await nextTick()
  if (conversationRef.value) {
    conversationRef.value?.changeMessageExtraContent(conversationActive.value.item)
  }
}

async function onConversationsChange(conversationItem:ServerConversationItem) {
  if (conversationActive.value.loading) {
    return;
  }
  if (conversationActive.value?.item?.key === conversationItem.key) {
    return
  }
  conversationActive.value.item = conversationItem
  if (!conversationActive.value.item?.data) {
    return
  }
  await loadConversationData(Number(conversationActive.value.item?.data?.room?.id),1, false)
  await nextTick()
  requestAnimationFrame(() => chatViewRef.value?.scrollTo({ top: "bottom", behavior: "smooth" }));
}

function onChatRoomRename(result: RestResult<IdValueMetadata<number, string>>) {
  if (!result.data) {
    return
  }
  const index = options.value.conversationDataSource.findIndex(s => s.room.id === result.data?.id)
  if (index < 0) {
    return
  }

  const find = options.value.conversationDataSource[index];
  if (find) {
    find.name = result.data.value
  }
  if (!conversationActive.value.item || !conversationActive.value.item?.data) {
    return
  }

  if (conversationActive.value.item?.data?.room?.id === result?.data?.id) {
    conversationActive.value.item.data.name = result.data?.value
    conversationActive.value.item.label = result.data?.value

    conversationRef.value?.changeMessageExtraContent(conversationActive.value.item)
    if (result?.data?.metadata) {
      const systemMessage:ChatBubbleItem = {
        key: String(result.timestamp),
        role: 'system',
        content: String(result?.data?.metadata.realName || globalProperties.$t('common.unname')) + '修改了名称(' + result.data?.value + ')'
      }
      conversationActive.value.bubbleList = [...conversationActive.value.bubbleList, systemMessage]
    }
  }
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
    SOCKET_EVENT_TYPE.CHAT_ROOM_RENAME,
    (payload) => onChatRoomRename(parseSocketRestPayload<IdValueMetadata<number, string>>(payload))
  ))
  options.value.loading = true
  try {
    const chatRoomResult: RestResult<UserChatConversationResponseBody[]> = await ChatMessageService.my({number: 1})
    if (chatRoomResult.data) {
      options.value.conversationDataSource = [...chatRoomResult.data]
      options.value.loadConversationDataSource = [...chatRoomResult.data]
    }
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
      options.value.loadContactDataSource = [...list]
    }
  } finally {
    options.value.loading = false
  }
}

async function onChatMessageReceived(result: RestResult<UserChatMessageResponseBody>) {
  if (!result.data || (result.data.participant?.metadata?.details as {systemName:string})?.systemName === principalStore.state.name) {
    return
  }

  if (conversationActive.value.item?.data?.room?.id === result.data.chatRoomId && chatViewRef.value) {
    chatViewRef.value.addMessage(result.data, 'ai')
  }

  await onSendMessage(result.data, true)
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

async function onChatViewNextPage(scrollBox:HTMLElement) {
  const roomId = Number(conversationActive.value.item?.data?.room?.id)
  if (!roomId) {
    return
  }
  const oldHeight = scrollBox.scrollHeight;
  await loadConversationData(roomId, conversationActive.value.dataSource.number + 1);
  await nextTick()
  scrollBox.scrollTop = oldHeight - scrollBox.scrollHeight
}

function onSearch(value:string) {
  if (value === '') {
    options.value.conversationDataSource = options.value.loadConversationDataSource
    options.value.contactDataSource = options.value.loadContactDataSource
  } else {
    options.value.conversationDataSource = findAllTreeNodes((r) => r.name.includes(value), options.value.loadConversationDataSource)
    options.value.contactDataSource = findAllTreeNodes((r) => String(r.label).includes(value), options.value.loadContactDataSource)
  }
}

function onConversationMoreClick() {
  conversationActive.value.drawerOpen = !conversationActive.value.drawerOpen;
}

async function onChatRooViewConfirm(user:PlatformUser[], restResult:RestResult<UserChatConversationResponseBody>) {
  if (!restResult.data) {
    return ;
  }
  options.value.loadConversationDataSource = [restResult.data, ...options.value.loadConversationDataSource]
  options.value.conversationDataSource = [restResult.data, ...options.value.conversationDataSource]
  onSearch(options.value.searchValue)
  await onConversationsChange({
    key: String(restResult.data.id),
    label: restResult.data.name,
    data: restResult.data
  })
  await nextTick()
  if (conversationRef.value) {
    conversationRef.value?.changeMessageExtraContent(conversationActive.value.item)
  }
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
            <div class="shrink-0 p-sm">
              <a-input v-model:value="options.searchValue" @search="onSearch"/>
            </div>
            <l-chat-conversation
              ref="conversationRef"
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
              @confirm="onChatRooViewConfirm"
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
