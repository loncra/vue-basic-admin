<script setup lang="ts">
import {AuthServerService} from "@/apis";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  inject,
  ref,
  resolveComponent,
  type VNode
} from "vue";
import type {UserChatConversationResponseBody} from "@/types/apis";
import {
  createAvatarNode,
  getDraftContent,
  getMessageContent,
  requireNonNullOrUndefined,
} from "@/utils";
import type {ServerConversationItem} from "@/types/composables";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY} from '@/constants';
import {useChatContext} from "@/composables/message-server/chat";
import {ImConversationList, type ImConversationHost} from '@loncra/antdv-chat-pro'
import {renderIconFont} from '@/utils/commonUtils'

defineOptions({
  name: 'LChatConversation',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const setMessageExtraContent = inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)

const messageServerStore = useMessageServerStore()
const {conversations, conversationActive, loader} = useChatContext()

const moreButtonActive = ref(false)
const emptyOpenKeys: string[] = []

const activeKey = computed(() => conversationActive.value.item?.key ?? "")

const emit = defineEmits<{
  delete: [item: UserChatConversationResponseBody]
}>()

const host = computed<ImConversationHost>(() => ({
  timeText: (unix) => globalProperties.$dayjs(unix).fromNow(),
  unreadCount: (id) => messageServerStore.getUserChatUnreadQuantity(Number(id)),
  principalName: (participant) => AuthServerService.getPrincipalNameByUserDetails(participant.metadata.details),
  messagePreview: (lastUserMessage, conversation) => getMessageContent(
    lastUserMessage as UserChatConversationResponseBody['lastUserMessage'],
    conversation as UserChatConversationResponseBody,
  ),
  draftPreview: (draft) => getDraftContent(draft as UserChatConversationResponseBody['draft']),
}))

function onMoreClick(item: ServerConversationItem) {
  if (!item.data) {
    return
  }
  moreButtonActive.value = !moreButtonActive.value
  conversationActive.value.drawerOpen = !conversationActive.value.drawerOpen
}

function createMoreButton(activeConversationItem: ServerConversationItem) {
  return h(
    resolveComponent('AButton'),
    {
      type: 'text',
      icon: () => renderIconFont(moreButtonActive.value ? 'loncra-panel-right-close' : 'loncra-panel-left-close'),
      size: 'small',
      onClick: () => onMoreClick(activeConversationItem),
    },
  )
}

function onActive(value: string, messageId?: number): void {
  const data = conversations.sortedDataSource.value.find((item) => String(item.id) === value)
  if (!data) {
    return
  }
  const activeConversationItem: ServerConversationItem = {
    key: value,
    label: data.name,
    data,
  }
  changeMessageExtraContent(activeConversationItem)
  if (!messageId && (data.mentions || []).length > 0) {
    messageId = data.mentions!.at(0)?.messageId
  }
  loader.switchConversation(activeConversationItem, messageId)
}

function changeMessageExtraContent(activeConversationItem: ServerConversationItem | undefined) {
  if (!activeConversationItem) {
    setMessageExtraContent?.(h('span'))
    return null
  }
  const label = h('span', {}, {default: () => activeConversationItem.label})
  const space = resolveComponent('ASpace')
  const avatar = createAvatarNode(activeConversationItem.data?.cover || [], String(activeConversationItem.label))
  const button = createMoreButton(activeConversationItem)
  const node: VNode = h(
    space,
    {},
    {default: () => [label, avatar, button]},
  )
  setMessageExtraContent?.(node)
}

defineExpose({
  changeMessageExtraContent,
})

</script>

<template>
  <im-conversation-list
    :items="conversations.sortedDataSource.value"
    :selected-keys="activeKey ? [activeKey] : []"
    :open-keys="emptyOpenKeys"
    :host="host"
    @active="onActive"
    @flags="conversations.patchFlags"
    @delete="emit('delete', $event)"
  />
</template>
