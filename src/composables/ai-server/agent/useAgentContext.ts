import type {
  ActiveAgentConversationItem,
  AgentChatContext,
  AgentConversationItem,
  ProvideAgentChatContextOptions
} from "@/types/composables";
import {AGENT_CHAT_CONTEXT_PROVIDE_KEY, DEFAULT_PAGE_RESULT_VALUE} from "@/constants";
import {inject, provide, ref} from "vue";
import {useAgentMessageLoader} from "@/composables";


export function provideAgentChatContext(options:ProvideAgentChatContextOptions): AgentChatContext {
  // 显式断言为 Ref<T>，避免 UnwrapRef 对 ConversationActiveProps 深度递归（TS2589）
  const conversationActive = ref<ActiveAgentConversationItem>();

  const loader = useAgentMessageLoader()

  async function activateConversation(
    conversation: AgentConversationItem | undefined,
    messageId?:number
  ): Promise<void> {
    if (!conversation) {
      return ;
    }

    conversationActive.value = {
      ...conversation,
      dataSource:DEFAULT_PAGE_RESULT_VALUE,
      loading:false
    }

    await loader.switchConversation(conversationActive, messageId)
  }

  const context: AgentChatContext = {
    conversationActive,
    activateConversation
  }

  provide(AGENT_CHAT_CONTEXT_PROVIDE_KEY, context)
  return context
}

export function useAgentChatContext(): AgentChatContext {
  const ctx = inject<AgentChatContext>(AGENT_CHAT_CONTEXT_PROVIDE_KEY)
  if (!ctx) {
    throw new Error('useChatContext() 必须在 provideChatContext() 的组件子树内调用')
  }
  return ctx
}
