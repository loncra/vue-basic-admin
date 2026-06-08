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
  type IdNameValueMetadata,
  type PageResult,
  type PlatformUser,
  type RestResult,
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
  ContactItem,
  ConversationActiveProps,
  ServerConversationItem
} from "@/types/composables";
import {useSocketStore} from "@/stores/socketStore.ts";
import {parseSocketRestPayload, SOCKET_EVENT_TYPE} from "@/types/socket.ts";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";

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
}>({
  conversationDataSource: [],
  contactDataSource: [],
  loading: false
})

const conversationActive = ref<ConversationActiveProps>({
  item: undefined,
  loading: false,
  sending: false,
  dataSource: {
    elements: [],
    first: false,
    last: false,
    number: 1,
    size: 10
  },
  bubbleList: []
})

const chatViewRef = ref<typeof LChatView>()

let stopChatMessageListener: (() => void) | undefined

async function loadConversationData(chatRoomId: number, number:number) {
  conversationActive.value.loading = true
  try {
    const result:RestResult<PageResult<UserChatMessageResponseBody>> = await ChatMessageService.histories({number}, chatRoomId)
    if (!result.data) {
      return;
    }
    conversationActive.value.dataSource = result.data
    const bubbleItems: ChatBubbleItem[] = []
    for (const d of conversationActive.value.dataSource.elements || []) {
      bubbleItems.push({
        key: String(d.id),
        role: principalStore.state.name === (d.participant?.metadata?.details as {systemName:string})?.systemName ? 'user' : 'ai',
        content: d.content,
        data:d
      })
    }
    const messageIds:number[] = conversationActive.value
      .dataSource
      .elements.filter(e => getEnumValue(e.readable) === 1)
      .map(e => Number(e.id))
    if (messageIds.length > 0) {
      await ChatMessageService.read(messageIds)
      await messageServerStore.fetchUnreadQuantity()
    }
    conversationActive.value.bubbleList = bubbleItems
  } finally {
    conversationActive.value.loading = false
  }
}

async function onSendMessage(entity: UserChatMessageEntity) {

  const find = options.value.conversationDataSource.find(d => d.room.id === entity.chatRoomId)
  if (find) {
    options.value.conversationDataSource = options.value.conversationDataSource.filter(d => d.room.id !== entity.chatRoomId)
    find.lastUserMessage = entity
    options.value.conversationDataSource = [
      find,
      ...options.value.conversationDataSource,
    ]
    options.value.conversationDataSource.sort((a, b) => {
      return globalProperties.$dayjs(b.lastUserMessage?.creationTime).diff(globalProperties.$dayjs(a.lastUserMessage?.creationTime))
    })
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
  segmented.value.value = 'conversation'
  await nextTick()
  onConversationsChange({
    label: find.name,
    key: String(find.id),
    data: find
  })
}

function onConversationsChange(conversationItem:ServerConversationItem): void {
  conversationActive.value.item = conversationItem
  if (!conversationActive.value.item?.data) {
    return
  }
  loadConversationData(Number(conversationActive.value.item?.data?.room?.id),1)
}

async function mounted() {
  options.value.loading = true
  try {
    stopChatMessageListener = socketStore.subscribe(
      SOCKET_EVENT_TYPE.CHAT_MESSAGE,
      (payload) => onChatMessageReceived(parseSocketRestPayload<UserChatMessageEntity>(payload))
    )
    const chatRoomResult: RestResult<UserChatConversationResponseBody[]> = await ChatMessageService.my({number: 1})
    if (chatRoomResult.data) {
      options.value.conversationDataSource = chatRoomResult.data
    }
    const contactResult: RestResult<IdNameValueMetadata<PlatformUser[]>[]> = await AuthServerService.systemUsers({number: -1})
    if (contactResult.data) {
      const list: ContactItem[] = []
      for (const r of contactResult.data) {
        for (const v of r.value) {
          list.push({
            key: String(v.id),
            label: v.realName || v.username,
            group: r.name,
            disabled: principalStore.state.name === v.systemName,
            data: v,
          })
        }
      }
      options.value.contactDataSource.push(...list)
    }
  } finally {
    options.value.loading = false
  }
}

async function onChatMessageReceived(result: RestResult<UserChatMessageEntity>) {
  if (!result.data || result.data.principal === principalStore.state.name) {
    return
  }

  if (!options.value.conversationDataSource.map(v => v.room.id).includes(result?.data?.chatRoomId)) {
    const conversation:RestResult<UserChatConversationResponseBody> = await ChatMessageService.createConversation({
        id: undefined,
        version: undefined
      },
      [result?.data?.principal]
    )
    if(conversation.data) {
      options.value.conversationDataSource = [conversation.data, ...options.value.conversationDataSource]
    }
  } else if (conversationActive.value.item?.data?.room?.id === result.data.chatRoomId && chatViewRef.value) {
    chatViewRef.value.addMessage(result.data, 'ai')
  }

  await onSendMessage(result.data)
}

onMounted(() => {
  stopChatMessageListener = socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE,
    (payload) => onChatMessageReceived(parseSocketRestPayload<UserChatMessageEntity>(payload))
  )
})

onUnmounted(() => stopChatMessageListener?.())

onMounted(mounted)
</script>

<template>
  <a-splitter class="h-full min-h-0">
    <a-splitter-panel class="h-full p-0 overflow-hiddenl" default-size="20%" min="15%" max="25%">
      <a-spin :spinning="options.loading" class="size-full-spin">
        <a-flex vertical class="size-full min-h-0">
          <div class="shrink-0 p-sm">
            <a-input-search/>
          </div>

          <l-chat-conversation
            @change="onConversationsChange"
            v-model:data-source="options.conversationDataSource"
            v-if="segmented.value === 'conversation'"
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
      <l-chat-view
        ref="chatViewRef"
        v-if="conversationActive.item"
        v-model:conversation="conversationActive"
        @send="onSendMessage"
      />
      <a-flex v-else vertical class="size-full" justify="center" align="center">
        <a-empty/>
      </a-flex>
    </a-splitter-panel>
  </a-splitter>
</template>
