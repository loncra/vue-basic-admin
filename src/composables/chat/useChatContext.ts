import {inject, type InjectionKey, provide, type Ref, ref} from 'vue'
import type {ConversationActiveProps, ServerConversationItem} from '@/types/composables'
import type {UserChatConversationResponseBody} from '@/types/apis'
import {DEFAULT_PAGE_RESULT_VALUE} from '@/constants/systemConstant.ts'
import {useChatConversations} from '@/composables/chat/useChatConversations.ts'
import {
  type ChatViewController,
  useChatMessageLoader,
} from '@/composables/chat/useChatMessageLoader.ts'
import {useChatSocketEvents} from '@/composables/chat/useChatSocketEvents.ts'

export interface ProvideChatContextOptions {
  /** ChatView 实例引用，供加载器执行滚动 / 跳转 / 取草稿 */
  view: Ref<ChatViewController | undefined>
  /** 刷新活跃会话头部额外内容（ChatConversation.changeMessageExtraContent） */
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
}

export interface ChatContext {
  conversationActive: Ref<ConversationActiveProps>
  conversations: ReturnType<typeof useChatConversations>
  loader: ReturnType<typeof useChatMessageLoader>
  /** 按会话实体激活（含头部刷新）；传 undefined 清空 */
  activateConversation: (body: UserChatConversationResponseBody | undefined) => Promise<void>
  /** 全量刷新会话列表并保持当前激活态 */
  refreshConversations: () => Promise<void>
}

const CHAT_CONTEXT_KEY: InjectionKey<ChatContext> = Symbol('chat-context')

function createDefaultActive(): ConversationActiveProps {
  return {
    item: undefined,
    loading: false,
    sending: false,
    readableAnchorLoading: false,
    loadConversationDataLock: false,
    isOnLastPage: false,
    isOnFirstPage: true,
    dataSource: DEFAULT_PAGE_RESULT_VALUE,
    drawerOpen: false,
    bubbleList: [],
  }
}

/**
 * 在 MyChatMessage 顶层调用，聚合并 provide chat 模块共享状态。
 * 子组件通过 useChatContext() 注入消费，取代 conversationActive 的 defineModel 透传。
 */
export function provideChatContext(options: ProvideChatContextOptions): ChatContext {
  // 显式断言为 Ref<T>，避免 UnwrapRef 对 ConversationActiveProps 深度递归（TS2589）
  const conversationActive = ref<ConversationActiveProps>(
    createDefaultActive(),
  ) as Ref<ConversationActiveProps>
  const conversations = useChatConversations()
  const loader = useChatMessageLoader(conversationActive, options.view)

  async function activateConversation(
    body: UserChatConversationResponseBody | undefined,
  ): Promise<void> {
    if (body) {
      const item: ServerConversationItem = {
        key: String(body.id),
        label: body.name,
        data: body,
      }
      await loader.switchConversation(item)
      options.refreshActiveHeader(conversationActive.value.item)
    } else {
      conversationActive.value.item = undefined
      options.refreshActiveHeader(undefined)
      conversationActive.value.drawerOpen = false
    }
  }

  const socketEvents = useChatSocketEvents({
    conversationActive,
    conversations,
    hasView: () => !!options.view.value,
    refreshActiveHeader: options.refreshActiveHeader,
    activateConversation,
  })

  const context: ChatContext = {
    conversationActive,
    conversations,
    loader,
    activateConversation,
    refreshConversations: socketEvents.onConversationRefresh,
  }
  provide(CHAT_CONTEXT_KEY, context)
  return context
}

export function useChatContext(): ChatContext {
  const ctx = inject(CHAT_CONTEXT_KEY)
  if (!ctx) {
    throw new Error('useChatContext() 必须在 provideChatContext() 的组件子树内调用')
  }
  return ctx
}
