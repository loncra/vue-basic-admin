import type {AgentChatContext, AgentConversationItem} from "@/types/composables";
import {AGENT_CHAT_CONTEXT_PROVIDE_KEY} from "@/constants";
import {inject, provide, ref, toRef} from "vue";


export function provideAgentChatContext(): AgentChatContext {
  // 显式断言为 Ref<T>，避免 UnwrapRef 对 ConversationActiveProps 深度递归（TS2589）
  const conversationActive = ref<AgentConversationItem>();

  const context: AgentChatContext = {
    conversationActive,
    loading:toRef(false)
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
