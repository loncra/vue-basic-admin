import type {
  ActiveAgentConversationItem,
  AgentChatContext,
  AgentConversationItem,
  ProvideAgentChatContextOptions
} from "@/types/composables";
import {
  AGENT_CHAT_CONTEXT_PROVIDE_KEY,
  AGENT_CONVERSATION_TYPE,
  DEFAULT_PAGE_RESULT_VALUE
} from "@/constants";
import {inject, provide, ref} from "vue";
import {useAgentMessageLoader} from "@/composables";
import {findFirstTreeNode, getEnumValue} from "@/utils";


export function provideAgentChatContext(options:ProvideAgentChatContextOptions): AgentChatContext {
  // 显式断言为 Ref<T>，避免 UnwrapRef 对 ConversationActiveProps 深度递归（TS2589）
  const conversationActive = ref<ActiveAgentConversationItem>();
  const conversations = ref<AgentConversationItem[]>([])

  const loader = useAgentMessageLoader(options.view)

  async function activateConversation(
    conversation: AgentConversationItem | undefined,
    messageId?:number
  ): Promise<void> {
    if (!conversation) {
      conversationActive.value = undefined
      return
    }

    conversationActive.value = {
      dataSource:DEFAULT_PAGE_RESULT_VALUE,
      loading:false,
      ...conversation
    }

    if (getEnumValue(conversationActive.value.type) !== AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION) {
      return
    }

    prependConversationIfMissing(conversationActive.value)
    await loader.switchConversation(conversationActive, messageId)
  }

  function prependConversationIfMissing(conversation: AgentConversationItem) {
    const find = findFirstTreeNode(c => Number(c.id) === conversationActive.value?.id, conversations.value)
    if (find) {
      return
    }
    const parent = conversations.value.find(s => s.id === conversationActive.value?.parentId)
    if (!parent) {
      return
    }

    parent.children = [
      conversation,
      ...(parent.children || [])
    ]
  }

  const context: AgentChatContext = {
    conversations,
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
