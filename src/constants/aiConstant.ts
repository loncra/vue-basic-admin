import type {AgentChatStatus, AgentSseMessageContent} from "@/types/composables";
import {AGENT_CHAT_STATUS, AGENT_CONTENT_TYPE,} from "@/constants/variableConstant.ts";

export {
  AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE,
  AGENT_WORKSPACE_TYPE_VALUE,
  AI_SERVER_MODEL_SETTING_AUTHORITY,
  BLOCK_RUNNING_STATUS_VALUE,
  MCP_CLIENT_HTTP_TYPE_VALUE,
  MCP_GROUP_CODE_PREFIX,
  MCP_PACKAGE_AUTHORITY,
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_GENERATE_OPTION_NUMBER_KEYS,
  MODEL_GENERATE_OPTION_STRING_KEYS,
  MODEL_SETTING_MANUFACTURER_CODE_PREFIX,
  SKILL_GROUP_CODE_PREFIX,
  SKILL_PACKAGE_AUTHORITY,
  SKILL_SOURCE_TYPE,
  SKILL_UPDATE_POLICY,
  STREAM_APPEND_TYPES,
  STREAM_RUNNING_STATUS_VALUE,
  UPDATE_CONVERSATION_TYPES,
} from '@loncra/client/ai'

export type {ModelGenerateOptionKey} from '@loncra/client/ai'

export const AGENT_CHAT_CONTEXT_PROVIDE_KEY = "agentChatContextProvide"

export const TOKEN_USAGE_TYPE: Readonly<AgentSseMessageContent['type']> = AGENT_CONTENT_TYPE.TOKEN_USAGE

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

export const AI_SERVER_MODEL_SETTING_ROUTE = {
  HOME: 'ai_server_model_setting',
  ADD: 'ai_server_model_setting_add',
  EDIT: 'ai_server_model_setting_edit',
  DETAIL: 'ai_server_model_setting_detail',
} as const

export const MODEL_SETTING_MANUFACTURER_CODE_QUERY = 'manufacturerCode'

export const MCP_PACKAGE_ROUTE = {
  HOME: 'ai_server_mcp_package',
  ADD: 'ai_server_mcp_package_add',
  EDIT: 'ai_server_mcp_package_edit',
  DETAIL: 'ai_server_mcp_package_detail',
} as const

export const SKILL_PACKAGE_ROUTE = {
  HOME: 'ai_server_skill_package',
  ADD: 'ai_server_skill_package_add',
  EDIT: 'ai_server_skill_package_edit',
  DETAIL: 'ai_server_skill_package_detail',
} as const

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
