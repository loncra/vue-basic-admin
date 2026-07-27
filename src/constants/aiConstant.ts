import type {AgentChatStatus, AgentSseMessageContent} from "@/types/composables";

export const AGENT_CHAT_CONTEXT_PROVIDE_KEY = "agentChatContextProvide"

export const AGENT_CONVERSATION_TYPE = {
  DEFAULT_WORKSPACE:10,
  CUSTOMIZE_WORKSPACE:20,
  WORKSPACE_CONVERSATION:30
} as const

export const AGENT_CHAT_STATUS = {
  READY:10,
  RUNNING:20,
  STOPPED:30,
  COMPLETED:35,
  FAILED:40
} as const

/** 助手消息 content 块 type（对齐后端 AgentContentType） */
export const AGENT_CONTENT_TYPE = {
  THINK: "think",
  TOOL:"tool",
  ANSWER:"answer",
  ERROR:"error",
  AGENT_STATUS_CHANGE:"agentStatusChange",
  MODEL_COMPLETED:"modelCompleted",
  COMPLETED:"completed",
  ASSISTANT:"assistant",
  GENERATE_CONVERSATION_NAME:"generateConversationName"
} as const

/** 助手 content 块 status */
export const AGENT_BLOCK_STATUS = {
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const

export const AGENT_CHAT_STATUS_STYLE = {
  [AGENT_CHAT_STATUS.READY]: {
    icon: 'loncra-fish',
    textClass: 'text-text-secondary',
    spin: false,
  },
  [AGENT_CHAT_STATUS.RUNNING]: {
    icon: 'loncra-loader-pinwheel',
    textClass: 'text-primary',
    spin: true,
  },
  [AGENT_CHAT_STATUS.STOPPED]: {
    icon: 'loncra-circle-stop',
    textClass: 'text-warning',
    spin: false,
  },
  [AGENT_CHAT_STATUS.COMPLETED]: {
    icon: 'loncra-badge-check',
    textClass: 'text-success',
    spin: false,
  },
  [AGENT_CHAT_STATUS.FAILED]: {
    icon: 'loncra-octagon-x',
    textClass: 'text-error',
    spin: false,
  },
} as const satisfies Record<AgentChatStatus, { icon: string; textClass: string; spin: boolean }>


export const MODEL_TYPE = {
  CHAT:10,
  IMAGE:20,
  VIDEO:30,
  VOICE:40,
  MUSIC:50,
} as const

export const THOUGHT_CHAIN_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.THINK,
  AGENT_CONTENT_TYPE.TOOL
]

export const TEXT_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.THINK,
  AGENT_CONTENT_TYPE.ANSWER,
  AGENT_CONTENT_TYPE.ERROR,
]

export const BUBBLE_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.ERROR,
  AGENT_CONTENT_TYPE.ANSWER
]

export const UPDATE_CONVERSATION_TYPE: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE,
  AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
]
