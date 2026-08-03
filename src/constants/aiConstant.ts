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
  TOKEN_USAGE:"tokenUsage",
  STREAM_START:"streamStart",
  STREAM_END:"streamEnd",
  ASSISTANT:"assistant",
  GENERATE_CONVERSATION_NAME:"generateConversationName"
} as const

/** 助手 content 块 status */
export const AGENT_BLOCK_STATUS = {
  READY:'ready',
  PENDING:'pending',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const

export const RUNNING_STATUS_VALUE:ReadonlyArray<string> = [AGENT_BLOCK_STATUS.READY, AGENT_BLOCK_STATUS.PENDING, AGENT_BLOCK_STATUS.RUNNING]

export const AGENT_TOOL_BLOCK_STATUS = {
  PENDING:"pending",
  ASKING:"asking",
  ALLOWED:"allowed",
  SUBMITTED:"submitted",
  FINISHED:"finished",
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

/** 模型厂商字典 code 前缀，对齐 tb 样例 `system.ai.model.*` */
export const MODEL_SETTING_MANUFACTURER_CODE_PREFIX = 'system.ai.model'

/** 对齐 {@code ModelSettingMetadata.MODEL_DEFAULT_OPTIONS_KEY} */
export const MODEL_DEFAULT_OPTIONS_KEY = 'options'

/** 对齐 ModelResolver.buildGenerateOptions 字段；表单/提交共用 */
export const MODEL_GENERATE_OPTION_KEYS = [
  'temperature',
  'topP',
  'topK',
  'maxTokens',
  'maxCompletionTokens',
  'frequencyPenalty',
  'presencePenalty',
  'seed',
  'thinkingBudget',
  'reasoningEffort',
  'cacheControl',
  'parallelToolCalls',
  'stream',
] as const

export type ModelGenerateOptionKey = (typeof MODEL_GENERATE_OPTION_KEYS)[number]

export const MODEL_GENERATE_OPTION_NUMBER_KEYS = [
  'temperature',
  'topP',
  'topK',
  'maxTokens',
  'maxCompletionTokens',
  'frequencyPenalty',
  'presencePenalty',
  'seed',
  'thinkingBudget',
] as const satisfies ReadonlyArray<ModelGenerateOptionKey>

export const MODEL_GENERATE_OPTION_BOOLEAN_KEYS = [
  'cacheControl',
  'parallelToolCalls',
  'stream',
] as const satisfies ReadonlyArray<ModelGenerateOptionKey>

export const MODEL_GENERATE_OPTION_STRING_KEYS = [
  'reasoningEffort',
] as const satisfies ReadonlyArray<ModelGenerateOptionKey>

export const MODEL_SETTING_DEFAULT_ICON = 'loncra-sticker'
export const MODEL_SETTING_MANUFACTURER_DEFAULT_ICON = 'loncra-building'

export const MODEL_SETTING_AUTHORITY = {
  FIND: 'perms[ai_server_mode_setting:find]',
  GET: 'perms[ai_server_mode_setting:get]',
  SAVE: 'perms[ai_server_mode_setting:save]',
  DELETE: 'perms[ai_server_mode_setting:delete]',
  SORT: 'perms[ai_server_mode_setting:sort]',
} as const

export const MODEL_SETTING_MANUFACTURER_CODE_QUERY = 'manufacturerCode'

export const MODEL_SETTING_MANUFACTURER_FILTER_JEQ = 'filter_[manufacturer.code_jeq]'

export const STREAM_APPEND_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.THINK,
  AGENT_CONTENT_TYPE.ANSWER,
  AGENT_CONTENT_TYPE.ERROR,
  AGENT_CONTENT_TYPE.TOOL,
]

/**
 * @deprecated
 */
export const BUBBLE_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.ERROR,
  AGENT_CONTENT_TYPE.ANSWER
]

export const UPDATE_CONVERSATION_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE,
  AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
]

export const TOKEN_USAGE_TYPE: Readonly<AgentSseMessageContent['type']> = AGENT_CONTENT_TYPE.TOKEN_USAGE

export const STREAM_UPDATE_TYPE: ReadonlyArray<AgentSseMessageContent['type']> = [AGENT_CONTENT_TYPE.STREAM_START, AGENT_CONTENT_TYPE.STREAM_END]
