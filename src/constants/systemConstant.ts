export const APP_RELOAD_PROVIDE_KEY = 'reload'
export const LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY = "closeContentTab"
export const LAYOUT_PANE_TITLE_PROVIDE_KEY = "paneTitle"
export const CHAT_CONTEXT_KEY = "chatContext"

export const SYSTEM_CONSTANT = {
  ID_NAME: 'id'
} as const
/**
 * @deprecated
 */
export const TYPING_ANCHOR = '\u200B'
/**
 * 消息分组
 * @deprecated
 */
export const MESSAGE_GROUP = {
  SITE: 'site',
  USER_CHAT: 'userChat'
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
 * SSE 相关常量
 */
export const SSE = {
  LAST_EVENT_ID: 'LAST-EVENT-ID',
  DURATION_EVENT_SUFFIX: '-duration',
  DOCS_EVENT_SUFFIX: '-docs',
  /** SSE 默认事件类型 */
  EVENT_TYPE: {
    TOOL_CALL: 'toolCall',
    TOOL_RESPONSE: 'toolResponse',
    THINKING: 'thinking',
    MESSAGE: 'message',
    INITIALIZED: 'initialized',
    COMPLETED: 'completed',
    ERROR: 'error',
    THINK_COMPLETED: 'thinkCompleted',
    STOPPED: 'stopped',
    TOKEN_USAGE: 'tokenUsage',
    GENERATE_CHAT_TITLE: 'generateChatTitle',
    REFRESH: 'refresh',
  },
  /** SSE 协议字段前缀 */
  FIELD: {
    EVENT: 'event:',
    DATA: 'data:',
    ID: 'id:',
    RETRY: 'retry:',
    COMMENT: 'comment:',
  },
} as const

/**
 * 验证正则表达式集合
 */
export const VALID_REGX = {
  PHONE_NUMBER: /^1[3456789]\d{9}$/,
  PASSWORD: /^(?!^[0-9a-z]+$)(?!^[0-9A-Z]+$)(?!^[0-9\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[a-zA-Z]+$)(?!^[a-z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)[a-z0-9A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$/,
} as const

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

export const TIME_UNIT_TYPE = {
  /**
   * Time unit representing one thousandth of a microsecond.
   */
  NANOSECONDS: "NANOSECONDS",
  /**
   * Time unit representing one thousandth of a millisecond.
   */
  MICROSECONDS: "MICROSECONDS",
  /**
   * Time unit representing one thousandth of a second.
   */
  MILLISECONDS: "MILLISECONDS",
  /**
   * Time unit representing one second.
   */
  SECONDS: "SECONDS",
  /**
   * Time unit representing sixty seconds.
   */
  MINUTES: "MINUTES",
  /**
   * Time unit representing sixty minutes.
   */
  HOURS: "HOURS",
  /**
   * Time unit representing twenty four hours.
   */
  DAYS: "DAYS",
}

export const DATE_TIME_FORMAT = {
  POST_DATE_FORMAT: import.meta.env.VITE_APP_POST_DATE_FORMAT,
  POST_DATETIME_FORMAT: import.meta.env.VITE_APP_POST_DATETIME_FORMAT,
  POST_TIMESTAMP_FORMAT: import.meta.env.VITE_APP_POST_TIMESTAMP_FORMAT
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
