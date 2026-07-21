import type {AgentChatStatus} from "@/types/composables";

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
