export const AGENT_CHAT_CONTEXT_PROVIDE_KEY = "agentChatContextProvide"

/** 侧栏列表行类型：工作空间源节点 / 拍平后的会话行 */
export const AGENT_LIST_ITEM_KIND = {
  WORKSPACE: 'workspace',
  CONVERSATION: 'conversation',
} as const

export const MODEL_TYPE = {
  CHAT:10,
  IMAGE:20,
  VIDEO:30,
  VOICE:40,
  MUSIC:50,
} as const
