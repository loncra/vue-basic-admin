import {inject, provide, type Ref, ref} from 'vue'
import type {
  ProvideUserChatContextOptions,
  ServerConversationItem,
  UserChatContext,
  UserChatConversationActiveProps,
} from '@/types/composables'
import type {UserChatConversationResponseBody} from '@/types/apis'
import {DEFAULT_PAGE_RESULT_VALUE, USER_CHAT_CONTEXT_PROVIDE_KEY} from '@/constants'
import {useChatConversations} from '@/composables/message-server/chat/useChatConversations.ts'
import {useChatMessageLoader} from '@/composables/message-server/chat/useChatMessageLoader.ts'
import {useChatSocketEvents} from '@/composables/message-server/chat/useChatSocketEvents.ts'

function createDefaultActive(): UserChatConversationActiveProps {
  return {
    item: undefined,
    loading: false,
    sending: false,
    readableAnchorLoading: false,
    isOnLastPage: false,
    isOnFirstPage: true,
    dataSource: {...DEFAULT_PAGE_RESULT_VALUE, elements: []},
    drawerOpen: false,
    participants: [],
  }
}

/**
 * 在 MyChatMessage 顶层调用，聚合并 provide chat 模块共享状态。
 */
export function provideUserChatContext(options: ProvideUserChatContextOptions): UserChatContext {
  const conversationActive = ref<UserChatConversationActiveProps>(
    createDefaultActive(),
  ) as Ref<UserChatConversationActiveProps>
  const conversations = useChatConversations()
  const loader = useChatMessageLoader(conversationActive, options.view)

  async function activateConversation(
    body: UserChatConversationResponseBody | undefined,
    messageId?: number,
  ): Promise<void> {
    conversationActive.value.drawerOpen = false
    if (body) {
      if (!Array.isArray(body.draft)) {
        body.draft = []
      }
      const item: ServerConversationItem = {
        key: String(body.id),
        label: body.name,
        data: body,
      }
      await loader.switchConversation(item, messageId)
      options.refreshActiveHeader(conversationActive.value.item)
    } else {
      conversationActive.value.item = undefined
      options.refreshActiveHeader(undefined)
    }
  }

  const socketEvents = useChatSocketEvents({
    conversationActive,
    conversations,
    hasView: () => !!options.view.value,
    refreshActiveHeader: options.refreshActiveHeader,
    activateConversation,
  })

  const context: UserChatContext = {
    conversationActive,
    conversations,
    loader,
    activateConversation,
    refreshConversations: socketEvents.onConversationRefresh,
  }
  provide(USER_CHAT_CONTEXT_PROVIDE_KEY, context)
  return context
}

export function useChatContext(): UserChatContext {
  const ctx = inject<UserChatContext>(USER_CHAT_CONTEXT_PROVIDE_KEY)
  if (!ctx) {
    throw new Error('useChatContext() 必须在 provideChatContext() 的组件子树内调用')
  }
  return ctx
}
