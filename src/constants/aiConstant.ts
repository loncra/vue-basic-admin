import type {AgentChatStatus, AgentSseMessageContent} from "@/types/composables";
import {
  AGENT_BLOCK_STATUS,
  AGENT_CHAT_STATUS,
  AGENT_CONTENT_TYPE,
  AGENT_TOOL_BLOCK_STATUS,
  MCP_CLIENT_TYPE
} from "@/constants/variableConstant.ts";

export const AGENT_CHAT_CONTEXT_PROVIDE_KEY = "agentChatContextProvide"

export const TOKEN_USAGE_TYPE: Readonly<AgentSseMessageContent['type']> = AGENT_CONTENT_TYPE.TOKEN_USAGE

export const BLOCK_RUNNING_STATUS_VALUE:ReadonlyArray<string> = [AGENT_BLOCK_STATUS.READY, AGENT_BLOCK_STATUS.PENDING, AGENT_BLOCK_STATUS.RUNNING]

export const STREAM_RUNNING_STATUS_VALUE:ReadonlyArray<number> = [AGENT_CHAT_STATUS.READY, AGENT_CHAT_STATUS.RUNNING]

export const AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE:ReadonlyArray<string> = [AGENT_TOOL_BLOCK_STATUS.PENDING, AGENT_TOOL_BLOCK_STATUS.ASKING]

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
  [AGENT_CHAT_STATUS.REQUEST_STOP]: {
    icon: 'loncra-badge-question-mark',
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

export const MODEL_SETTING_MANUFACTURER_CODE_PREFIX = 'system.ai.model'
export const MCP_GROUP_CODE_PREFIX = 'system.ai.mcp.group'
export const SKILL_GROUP_CODE_PREFIX = 'system.ai.skill.group'

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

export const AI_SERVER_MODEL_SETTING_AUTHORITY = {
  FIND: 'perms[ai_server_mode_setting:find]',
  GET: 'perms[ai_server_mode_setting:get]',
  SAVE: 'perms[ai_server_mode_setting:save]',
  DELETE: 'perms[ai_server_mode_setting:delete]',
  SORT: 'perms[ai_server_mode_setting:sort]',
} as const

export const AI_SERVER_MODEL_SETTING_ROUTE = {
  HOME: 'ai_server_model_setting',
  ADD: 'ai_server_model_setting_add',
  EDIT: 'ai_server_model_setting_edit',
  DETAIL: 'ai_server_model_setting_detail',
} as const

export const MODEL_SETTING_MANUFACTURER_CODE_QUERY = 'manufacturerCode'

export const STREAM_APPEND_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.THINK,
  AGENT_CONTENT_TYPE.ANSWER,
  AGENT_CONTENT_TYPE.ERROR,
  AGENT_CONTENT_TYPE.TOOL,
]

export const UPDATE_CONVERSATION_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE,
  AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
]

export const MCP_PACKAGE_AUTHORITY = {
  PAGE: 'perms[ai_mcp_package:page]',
  GET: 'perms[ai_mcp_package:get]',
  SAVE: 'perms[ai_mcp_package:save]',
  DELETE: 'perms[ai_mcp_package:delete]',
  RELEASE: 'perms[ai_mcp_package:release]',
  REVOKE: 'perms[ai_mcp_package:revoke]'
} as const

export const MCP_PACKAGE_ROUTE = {
  HOME: 'ai_server_mcp_package',
  ADD: 'ai_server_mcp_package_add',
  EDIT: 'ai_server_mcp_package_edit',
  DETAIL: 'ai_server_mcp_package_detail',
} as const

export const SKILL_PACKAGE_AUTHORITY = {
  PAGE: 'perms[ai_skill_package:page]',
  GET: 'perms[ai_skill_package:get]',
  SAVE: 'perms[ai_skill_package:save]',
  DELETE: 'perms[ai_skill_package:delete]',
  RELEASE: 'perms[ai_skill_package:release]',
  REVOKE: 'perms[ai_skill_package:revoke]',
  SNAPSHOT: 'perms[ai_skill_package:snapshot]',
} as const

export const SKILL_PACKAGE_ROUTE = {
  HOME: 'ai_server_skill_package',
  ADD: 'ai_server_skill_package_add',
  EDIT: 'ai_server_skill_package_edit',
} as const

export const MCP_CLIENT_HTTP_TYPE_VALUE:ReadonlyArray<string> = [MCP_CLIENT_TYPE.SSE, MCP_CLIENT_TYPE.STREAMABLE_HTTP]

export const AGENT_CHAT_TYPE_STYLE = {
  "10":{
    color:'cyan',
    icon:'loncra-message-circle-question-mark',
  },
  "20":{
    color:'pink',
    icon:'loncra-clipboard-list',
  },
  "30":{
    color:'purple',
    icon:'loncra-bot',
  }
} as const
