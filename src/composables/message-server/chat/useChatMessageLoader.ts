import {type ComponentInternalInstance, getCurrentInstance, type Ref} from 'vue'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import {MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE} from '@loncra/client/message'
import type {ChatViewController, UserChatConversationActiveProps} from '@/types/composables'
import {requireNonNullOrUndefined} from '@/utils'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {CHAT_BUBBLE_TYPE} from '@/constants'
import {type ChatRole} from '@loncra/chat-core'
import {useImHistory} from '@loncra/antdv-chat-pro'
import {getEnumValue} from '@loncra/client/commons'

/**
 * 活跃会话的消息分页、锚点跳转与会话切换。
 * 请求和分页在 useImHistory。这里只提供文案、角色、滚动，以及切走前的草稿落盘。
 */
export function useChatMessageLoader(
  conversationActive: Ref<UserChatConversationActiveProps>,
  view: Ref<ChatViewController | undefined>,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties
  const principalStore = usePrincipalStore()

  function resolveRole(message: UserChatMessageResponseBody): ChatRole {
    let role: ChatRole =
      principalStore.state.name ===
      (message.participant?.metadata?.details as {systemName: string})?.systemName
        ? CHAT_BUBBLE_TYPE.USER
        : CHAT_BUBBLE_TYPE.AI
    if (getEnumValue(message.type) === MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM) {
      role = CHAT_BUBBLE_TYPE.SYSTEM
    }
    return role
  }

  return useImHistory(conversationActive, {
    noMoreText: () => globalProperties.$t('common.noMore'),
    nowUnix: () => globalProperties.$dayjs().unix(),
    readableSystemMessage: () => globalProperties.$t('chat.view.readable.systemMessage'),
    resolveRole,
    beforeSwitch: async () => {
      const active = conversationActive.value
      if (active.item?.data && view.value) {
        // 先写回列表项（内存「[草稿]」），再 flush。此时 sender 上的房间 id 仍是旧的。
        // 换 item 后按房间 key 重建，新实例自己还原。
        active.item.data.draft = view.value.getSenderSlotConfigValue()
        await view.value.persistSenderDraft()
      }
    },
    scrollToBottom: () => {
      view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    },
    jumpToMessage: (key, flashPending, block) => {
      view.value?.jumpToMessage(key, flashPending, block)
    },
  })
}

export type ChatMessageLoaderApi = ReturnType<typeof useChatMessageLoader>
