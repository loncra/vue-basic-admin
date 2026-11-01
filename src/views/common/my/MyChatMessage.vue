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
  BasicUserChatConversation,
  UserChatConversationResponseBody
} from '@loncra/client/message';
import {MESSAGE_SERVER_MESSAGE_GROUP} from '@loncra/client/message'
import type {SystemUserContactItem} from "@loncra/antdv-chat-pro";
import {createAvatarNode, ImChat, type ImChatExpose, type ImPageHost} from "@loncra/antdv-chat-pro";
import {useAppNotification} from '@loncra/antdv-pro'
import type {IdNameValueMetadata, RestResult} from "@loncra/client/commons";
import {AuthServerService, type PlatformUser} from "@loncra/client/auth";
import {requireNonNullOrUndefined} from "@/utils";
import {renderIconFont} from '@/utils/commonUtils'
import {usePrincipalStore} from "@/stores/principalStore";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {useSocketStore} from '@/stores/socketStore.ts'
import {MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY} from '@/constants'

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

const host: ImPageHost = {
  get self() {
    return {
      ...principalStore.state.details.metadata,
      systemName: principalStore.state.name,
    }
  },
  timeText: (unix) => globalProperties.$dayjs(unix).fromNow(),
  roomUploadPrefix: (roomId) => `user_chat_room/${roomId}`,
  unreadCount: (id) => messageServerStore.getUserChatUnreadQuantity(Number(id)),
  refreshUnread: async () => {
    await messageServerStore.fetchUnreadQuantity()
  },
  subscribe: (event, handler) => {
    const socketStore = useSocketStore()
    return socketStore.subscribe(
      event as Parameters<typeof socketStore.subscribe>[0],
      handler as Parameters<typeof socketStore.subscribe>[1],
    )
  },
}

const options = ref<{
  contactDataSource: SystemUserContactItem[]
  loading: boolean
}>({
  contactDataSource: [],
  loading: false,
})

const {getNotificationKey, destroy} = useAppNotification()

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
    <im-chat
      ref="chatRef"
      class="h-full min-h-0"
      :host="host"
      :contacts="options.contactDataSource"
      :loading="options.loading"
      @active="onActive"
      @muted="onMuted"
    />
  </div>

</template>
