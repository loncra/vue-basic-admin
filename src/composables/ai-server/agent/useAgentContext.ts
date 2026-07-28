import type {
  ActiveAgentConversationItem,
  AgentChatContext,
  AgentConversationItem,
  ProvideAgentChatContextOptions,
} from '@/types/composables'
import {
  AGENT_CHAT_CONTEXT_PROVIDE_KEY,
  AGENT_CONVERSATION_TYPE,
  DEFAULT_PAGE_RESULT_VALUE,
} from '@/constants'
import {inject, provide, ref} from 'vue'
import {useAgentMessageLoader, useAgentStream} from '@/composables'
import {filterTreeDeep, findFirstTreeNode, getEnumValue, unmergeTree} from '@/utils'

export function provideAgentChatContext(options: ProvideAgentChatContextOptions): AgentChatContext {
  const conversationActive = ref<ActiveAgentConversationItem>()
  const conversations = ref<AgentConversationItem[]>([])

  const loader = useAgentMessageLoader(conversationActive, options.view)
  const stream = useAgentStream(conversationActive, conversations)

  async function activateConversation(
    conversation: AgentConversationItem,
    messageId?: number,
  ): Promise<ActiveAgentConversationItem | undefined> {
    if (conversation.id === conversationActive.value?.id) {
      return conversationActive.value
    }

    stream.disconnectIfRunning()

    conversationActive.value = {
      dataSource: {...DEFAULT_PAGE_RESULT_VALUE, elements: []},
      loading: false,
      ...conversation,
    }

    if (
      getEnumValue(conversationActive.value.type) !== AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION
    ) {
      updateMenuOptions(conversationActive.value)
      return conversationActive.value
    }

    prependConversationIfMissing(conversationActive.value)
    await loader.switchConversation(conversationActive, messageId)
    stream.reconnectIfRunning()
    updateMenuOptions(conversationActive.value)
    return conversationActive.value;
  }

  function updateMenuOptions(conversation: AgentConversationItem) {

    const treeNode = filterTreeDeep(s => s.id === conversation.parentId, conversations.value)
    const unmerge = unmergeTree(treeNode)
    const openKeys = unmerge.filter(u => u.id !== conversation.id).map(u => String(u.id));

    menuOptions.value.openKeys = [...menuOptions.value.openKeys, ...openKeys]

    if (conversation.children) {
      menuOptions.value.openKeys = [...menuOptions.value.openKeys, String(conversation.id)]
      menuOptions.value.selectedKeys = []
    } else {
      menuOptions.value.selectedKeys = [String(conversation.id)]
    }
  }

  function prependConversationIfMissing(conversation: AgentConversationItem) {
    const find = findFirstTreeNode(
      (c) => Number(c.id) === conversationActive.value?.id,
      conversations.value,
    )
    if (find) {
      return
    }
    const parent = conversations.value.find((s) => s.id === conversationActive.value?.parentId)
    if (!parent) {
      return
    }

    parent.children = [conversation, ...(parent.children || [])]
  }

  const menuOptions = ref<{
    openKeys:string[]
    selectedKeys:string[]
  }>({
    openKeys:[],
    selectedKeys:[]
  })

  const context: AgentChatContext = {
    conversations,
    conversationActive,
    activateConversation,
    menuOptions,
    loader,
    stream,
  }

  provide(AGENT_CHAT_CONTEXT_PROVIDE_KEY, context)
  return context
}

export function useAgentChatContext(): AgentChatContext {
  const ctx = inject<AgentChatContext>(AGENT_CHAT_CONTEXT_PROVIDE_KEY)
  if (!ctx) {
    throw new Error('useChatContext() 必须在 provideChatContext() 的组件子树内使用')
  }
  return ctx
}
