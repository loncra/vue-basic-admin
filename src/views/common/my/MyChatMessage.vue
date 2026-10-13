<script setup lang="ts">
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onActivated,
  onMounted,
  ref,
  resolveComponent,
  type VNode,
} from "vue";
import type {
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from "@/types/apis";
import type {SystemUserContactItem} from "@loncra/antdv-pro";
import {useAppNotification} from '@loncra/antdv-pro'
import type {IdNameValueMetadata, IdValueMetadata, RestResult} from "@loncra/client/commons";
import {AuthServerService, type PlatformUser} from "@loncra/client/auth";
import type {BasicUserChatConversation} from "@loncra/client/message";
import {MESSAGE_SERVER_MESSAGE_GROUP} from '@loncra/client/message'
import {
  createAvatarNode,
  getDraftContent,
  getMessageContent,
  requireNonNullOrUndefined
} from "@/utils";
import {renderIconFont} from '@/utils/commonUtils'
import {usePrincipalStore} from "@/stores/principalStore";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {useSocketStore} from '@/stores/socketStore.ts'
import {parseSocketRestPayload} from '@/types/socket.ts'
import {ImChat as LIm, type ImChatExpose, type ImPageHost} from "@loncra/antdv-chat-pro";
import {MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY, SOCKET_EVENT_TYPE} from '@/constants'
import {useSocketSubscriptions} from "@/composables";

defineOptions({
  name: 'MyChatMessageHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties


let booted = false
const principalStore = usePrincipalStore()
const messageServerStore = useMessageServerStore()
const setExtraContent = inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)
const chatRef = ref<ImChatExpose>()
const roomOpen = ref(false)
const activeConversation = ref<UserChatConversationResponseBody>()

const socketStore = useSocketStore()
const host: ImPageHost = {
  get self() {
    return {
      ...principalStore.state.details.metadata,
      systemName: principalStore.state.name,
    }
  },
  timeText: (unix) => globalProperties.$dayjs(unix).fromNow(),
  messagePreview: (message, conversation) => getMessageContent(message, conversation),
  draftPreview: (draft) => getDraftContent(draft),
  unreadCount: (id) => messageServerStore.getUserChatUnreadQuantity(Number(id)),
  refreshUnread: async () => {
    await messageServerStore.fetchUnreadQuantity()
  },
  subscribeReadUpdate: (handler) => socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ_UPDATE,
    (payload) => {
      const result = parseSocketRestPayload<IdValueMetadata<number, number>[]>(payload)
      handler(result.data ?? [])
    },
  ),
}

const options = ref<{
  contactDataSource: SystemUserContactItem[]
  loading: boolean
}>({
  contactDataSource: [],
  loading: false,
})

const {getNotificationKey, destroy} = useAppNotification()

const {on} = useSocketSubscriptions()

on(SOCKET_EVENT_TYPE.CHAT_MESSAGE, (payload) => {
  const result = parseSocketRestPayload<UserChatMessageResponseBody | UserChatMessageEntity>(payload)
  if (result.data) {
    chatRef.value?.applyIncomingMessage(result.data)
  }
})
on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_CREATE, (payload) => {
  const result = parseSocketRestPayload<UserChatConversationResponseBody>(payload)
  if (result.data) {
    void chatRef.value?.addConversation(result.data)
  }
})
on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID, (payload) => {
  const result = parseSocketRestPayload<number>(payload)
  if (result.data) {
    void chatRef.value?.refreshConversationByRoom(result.data)
  }
})
on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH, () => {
  void chatRef.value?.refreshConversations()
})
on(SOCKET_EVENT_TYPE.CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID, (payload) => {
  const result = parseSocketRestPayload<number>(payload)
  if (result.data) {
    void chatRef.value?.refreshParticipants(result.data)
  }
})
on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ, (payload) => {
  const result = parseSocketRestPayload<UserChatMessageResponseBody | UserChatMessageEntity>(payload)
  if (result.data) {
    chatRef.value?.applyMessageUpdate(result.data)
  }
})
on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_UPDATE, (payload) => {
  const result = parseSocketRestPayload<UserChatMessageResponseBody | UserChatMessageEntity>(payload)
  if (result.data) {
    chatRef.value?.applyMessageUpdate(result.data)
  }
})
on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_UNDO, (payload) => {
  const result = parseSocketRestPayload<UserChatMessageEntity>(payload)
  if (result.data) {
    chatRef.value?.applyMessageUndo(result.data)
  }
})

function paintHeader() {
  const conversation = activeConversation.value
  if (!setExtraContent) {
    return
  }
  if (!conversation) {
    setExtraContent(h('span'))
    return
  }
  const name = conversation.name || ''
  const button = resolveComponent('AButton')
  const space = resolveComponent('ASpace')
  setExtraContent(h(space, {}, {
    default: () => [
      h('span', {}, {default: () => name}),
      createAvatarNode(conversation.cover || [], name),
      h(button, {
        type: 'text',
        size: 'small',
        icon: () => renderIconFont(roomOpen.value ? 'loncra-panel-right-close' : 'loncra-panel-left-close'),
        onClick: () => {
          roomOpen.value = !roomOpen.value
          chatRef.value?.setRoomSettingsOpen(roomOpen.value)
          paintHeader()
        },
      }),
    ],
  }))
}

function onActive(conversation: UserChatConversationResponseBody | undefined) {
  if (!conversation || conversation.id !== activeConversation.value?.id) {
    roomOpen.value = false
  }
  activeConversation.value = conversation
  paintHeader()
}

function onMuted(body: BasicUserChatConversation) {
  messageServerStore.setUserChatMessageMutedValue(Number(body.id), body.muted)
}

async function mounted() {
  const keys: unknown | null = getNotificationKey(MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT)
  if (keys) {
    const messageNotificationKeys = keys as Set<string>
    messageNotificationKeys.forEach(destroy)
  }
  options.value.loading = true
  try {
    await chatRef.value?.refreshConversations()
    const contactResult: RestResult<IdNameValueMetadata<PlatformUser[]>[]> =
      await AuthServerService.systemUsers({number: -1}, true, false)
    if (contactResult.data) {
      const list: SystemUserContactItem[] = []
      for (const row of contactResult.data) {
        row.value.forEach((user) =>
          list.push({
            key: String(user.id),
            label: user.realName || user.username,
            group: row.name,
            disabled: principalStore.isCurrentPrincipal(user.systemName),
            data: user,
          }),
        )
      }
      options.value.contactDataSource = [...list]
    }
  } finally {
    options.value.loading = false
  }
  booted = true
  await openFromRoute()
}

async function openFromRoute(scrollBottom = false) {
  const id = Number(globalProperties.$route.query.conversationId)
  if (Number.isFinite(id)) {
    const messageId = Number(globalProperties.$route.query.messageId)
    await chatRef.value?.openConversation(id, Number.isFinite(messageId) ? messageId : undefined)
  }
  if (!scrollBottom) {
    return
  }
  await nextTick()
  chatRef.value?.scrollToBottom()
}

onMounted(mounted)

onActivated(() => {
  if (!booted) {
    return
  }
  void openFromRoute(true)
})
</script>

<template>
  <div class="h-full min-h-120">
    <l-im
      ref="chatRef"
      class="h-full min-h-0"
      :host="host"
      :contacts="options.contactDataSource"
      :loading="options.loading"
      @update:contacts="(value: SystemUserContactItem[]) => options.contactDataSource = value"
      @update:loading="(value: boolean) => options.loading = value"
      @active="onActive"
      @muted="onMuted"
    />
  </div>

</template>
