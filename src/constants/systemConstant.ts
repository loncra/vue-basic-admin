export const APP_RELOAD_PROVIDE_KEY = 'reload'
export const LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY = "closeContentTab"
export const LAYOUT_PANE_TITLE_PROVIDE_KEY = "paneTitle"

export const SYSTEM_CONSTANT = {
  ID_NAME: 'id'
} as const

/**
 * 系统所有 store 的 id
 */
export const STORE = {
  CONFIG_PROVIDER_ID: 'configProvider',
  PRINCIPAL_ID: 'principal',
  MESSAGE_SERVER_ID: 'messageServer',
  SOCKET_ID: 'socket',
  MENU_ID: 'menu',
} as const

/**
 * HTTP 相关常量
 */
export const HTTP = {
  /** 业务状态码 - 表示成功的 executeCode 值 */
  SUCCESS_EXECUTE_CODES: ['200'],
  /** HTTP 状态码错误消息映射 */
  ERROR_MESSAGES: {
    '400': '请求参数错误',
    '401': '请重新认证账户',
    '403': '您没有权限访问',
    '404': '请求的资源不存在',
    '408': '请求超时',
    '500': '服务器内部错误',
    '502': '网关错误',
    '503': '服务不可用',
    '504': '网关超时',
  } as Record<string, string>,
  /** HTTP 请求头常量 */
  HEADER: {
    ACCEPT: 'Accept',
    CACHE_CONTROL: 'Cache-Control',
    CONTENT_TYPE: 'Content-Type',
  },
  /** HTTP 请求头值常量 */
  CONTENT_TYPE: {
    EVENT_STREAM: 'text/event-stream',
    JSON: 'application/json',
  },
  /** HTTP 缓存控制值 */
  CACHE_CONTROL: {
    NO_CACHE: 'no-cache',
  },
} as const

/**
 * 验证正则表达式集合
 */
export const VALID_REGX = {
  PHONE_NUMBER: /^1[3456789]\d{9}$/,
  PASSWORD: /^(?!^[0-9a-z]+$)(?!^[0-9A-Z]+$)(?!^[0-9\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[a-zA-Z]+$)(?!^[a-z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)[a-z0-9A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$/,
  ILLEGAL_FILE_OR_FOLDER_NAME: /[\u0000-\u001f\u007f/\\<>"|?*]/
} as const

export const RESERVED_FILE_OR_FOLDER_NAME = new Set(['.', '..'])
export const FILE_OR_FOLDER_NAME_MAX_LENGTH = 255
/**
 * http 请求方法
 */
export const HTTP_REQUEST_METHOD = {
  GET: 'GET',
  HEAD: 'HEAD',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  TRACE: 'TRACE',
}

export const DATE_TIME_FORMAT = {
  POST_DATE_FORMAT: import.meta.env.VITE_APP_POST_DATE_FORMAT,
  POST_DATETIME_FORMAT: import.meta.env.VITE_APP_POST_DATETIME_FORMAT,
  POST_TIMESTAMP_FORMAT: import.meta.env.VITE_APP_POST_TIMESTAMP_FORMAT,
  POST_TIME_FORMAT: import.meta.env.VITE_APP_POST_TIME_FORMAT
} as const


export const ATTACHMENT_UPLOAD_MODE = {
  PICTURE_CARD:'picture-card',
  DRAGGER:'dragger',
  CUSTOMIZE:'customize'
} as const

export const ATTACHMENT_PREVIEW_MODE = {
  LIST:'list',
  PICTURE_CARD:'picture-card'
} as const

export const DEFAULT_PAGE_RESULT_VALUE = {
  elements: [],
  first: true,
  last: true,
  number: 1,
  size: 10,
  metadata:{}
}

export const DEFAULT_OPERATE_CATEGORY = {
  SYSTEM:10,
  CUSTOMIZE:20,
} as const

export const CHAT_BUBBLE_TYPE = {
  AI:'ai',
  SYSTEM:'system',
  USER:'user',
  DIVIDER:"divider"
} as const

export const SYSTEM_MODULE_NAME = {
  RESOURCE_SERVER:'resource-server',
  AI_SERVER:'ai-server',
  AUTH_SERVER:'auth-server',
  MESSAGE_SERVER:'message-server'
} as const

export const ICON_SELECT_MODE = {
  VIEW:'view',
  AVATAR:'avatar',
  INPUT:'input'
}

export const ICON_SELECT_AVATAR_MODE_VALUE = {
  ICON:'icon://',
  AVATAR:'avatar://',
  INPUT:'text://'
}

export const AVATAR_SCHEMES = [
  ICON_SELECT_AVATAR_MODE_VALUE.ICON,
  ICON_SELECT_AVATAR_MODE_VALUE.AVATAR,
  ICON_SELECT_AVATAR_MODE_VALUE.INPUT,
] as const

export const OPERATION_DATA_TRACE_TABLE = {
  DICTIONARY_TYPE: 'tb_dictionary_type',
  DATA_DICTIONARY: 'tb_data_dictionary',
  CAROUSEL: 'tb_carousel',
  SMS_MESSAGE: 'tb_sms_message',
  SITE_MESSAGE: 'tb_site_message',
  EMAIL_MESSAGE: 'tb_email_message',
  ROLE: 'tb_role',
  RESOURCE: 'tb_resource',
  CONSOLE_USER: 'tb_console_user',
  AI_MODEL_SETTING: 'tb_ai_model_setting',
  AI_MCP_PACKAGE: 'tb_ai_mcp_package',
  AI_SKILL_PACKAGE: 'tb_ai_skill_package',
} as const

