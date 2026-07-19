import type {AgentActiveConversationProps, AgentChatContext} from "@/types/composables";
import {DEFAULT_PAGE_RESULT_VALUE} from "@/constants/systemConstant.ts";
import {inject, provide, type Ref, ref} from "vue";
import {AGENT_CHAT_CONTEXT_PROVIDE_KEY} from "@/constants/aiConstant.ts";

function createDefaultActive(): AgentActiveConversationProps {
  return {
    dataSource: DEFAULT_PAGE_RESULT_VALUE
  }
}

export function provideAgentChatContext(): AgentChatContext {
  // 显式断言为 Ref<T>，避免 UnwrapRef 对 ConversationActiveProps 深度递归（TS2589）
  const conversationActive = ref<AgentActiveConversationProps>(
    createDefaultActive(),
  ) as Ref<AgentActiveConversationProps>

  const context: AgentChatContext = {
    workspaces:ref([]),
    conversationActive,
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
