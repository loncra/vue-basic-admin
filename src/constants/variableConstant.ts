export {
  DATA_RELEASE_STATUS,
  DATA_STATUS,
  EXECUTE_STATUS_TYPE,
  EXECUTE_TYPE_RETRY_STATUS,
  SYSTEM_ENUM_TYPE,
  TIME_UNIT_TYPE,
  VALUE_TYPE,
  YES_OR_NO_TYPE,
} from '@loncra/client/commons'

export {CAROUSEL_TYPE} from '@loncra/client/resource'

export {
  AGENT_BLOCK_STATUS,
  AGENT_CHAT_STATUS,
  AGENT_CONTENT_TYPE,
  AGENT_CONVERSATION_TYPE,
  AGENT_TOOL_BLOCK_STATUS,
  MCP_CLIENT_TYPE,
  MODEL_TYPE,
  PACKAGE_TYPE,
  PLUGIN_INSTALL_STATUS,
  PLUGIN_INSTALL_WORKSPACE_SCOPE,
  PLUGIN_TARGET_TYPE,
} from '@loncra/client/ai'

export {
  AUDIT_STATUS_VALUE,
  AUDIT_TYPE_VALUE,
  GENDER,
  RESOURCE_CATEGORY,
  USER_STATUS_TYPE,
} from '@loncra/client/auth'

export {
  CHAT_CALL_SCENE,
  CHAT_CALL_TYPE,
  MESSAGE_TYPE_VALUE,
  USER_CHAT_CALL_PARTICIPANT_STATUS,
  USER_CHAT_CALL_STATUS,
  USER_CHAT_CONVERSATION_STATUS,
  USER_CHAT_MESSAGE_TYPE,
  USER_CHAT_PARTICIPANT_TYPE,
  USER_CHAT_ROOM_TYPE,
} from '@loncra/client/message'

/** Agent 点名：TRIGGER 开弹层；MCP/SKILL 写入 instruction 槽 prefix */
export const AGENT_INSTRUCTION_PREFIX = {
  TRIGGER: '/',
  MCP: '/mcp',
  SKILL: '/skill',
} as const

export const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'])
export const VIDEO_EXT = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v'])
export const AUDIO_EXT = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac'])

export const TEXT_MAX_BYTES = 5 * 1024 * 1024
