export const APP_RELOAD_PROVIDE_KEY = 'reload'
export const LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY = "closeContentTab"
export const LAYOUT_PANE_TITLE_PROVIDE_KEY = "paneTitle"
export const MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY = "setExtraContent"

export const SYSTEM_CONSTANT = {
  ID_NAME: 'id'
} as const

export const TYPING_ANCHOR = '\u200B'

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
 * socket 事件相关
 */
export const SOCKET_EVENT_TYPE = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',
  CONNECT_TIMEOUT: 'connect_timeout',
  CLIENT_DISCONNECT: 'client_disconnect',
  /** 服务端推送的执行系统命令事件，payload 为 RestResult<string> */
  RUN_COMMAND: 'run_command',
} as const

/**
 * 主题模式类型
 */
export const CONFIG_PROVIDER_THEME = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
  ICON: {
    system: 'loncra-sun-moon',
    dark: 'loncra-moon',
    light: 'loncra-sun-medium',
  }
} as const

/**
 * 整体标准化配置相关
 */
export const CONFIG_PROVIDER = {
  MATCH_MEDIA_QUERY: '(prefers-color-scheme: dark)',
  STORED_STATE_VALUE: {
    mode: CONFIG_PROVIDER_THEME.SYSTEM,
    homeCollapsedWidth: 84,
    collapsible: false,
    formLayout: 'vertical',
    homeSiderWidth: 260,
    token:{},
    componentSize:'middle',
    compact: false,
    detailLayout: 'vertical',
  },
  CREATE_SUCCESS_BACK: {
    CURRENT:'current',
    HOME:'home'
  }
} as const

/**
 * 屏幕断点常量
 *
 * 用于响应式设计，对应 Ant Design Vue 的屏幕断点 token
 * 这些值用于判断当前屏幕尺寸，便于做响应式布局和功能调整
 *
 * @example
 * // 判断是否为平板大小
 * if (screen === SCREEN_BREAKPOINT.SCREEN_MD || screen === SCREEN_BREAKPOINT.SCREEN_LG) {
 *   // 平板布局逻辑
 * }
 */
export const SCREEN_BREAKPOINT = {
  /** 超超超大屏幕 (≥2000px) */
  SCREEN_XXXL: 'screenXXXL',
  /** 超超大屏幕 (≥1600px) */
  SCREEN_XXL: 'screenXXL',
  /** 超大屏幕 (≥1200px) */
  SCREEN_XL: 'screenXL',
  /** 大屏幕 (≥992px) - 笔记本 */
  SCREEN_LG: 'screenLG',
  /** 中等屏幕 (≥768px) - 平板 */
  SCREEN_MD: 'screenMD',
  /** 小屏幕 (≥576px) - 大屏手机 */
  SCREEN_SM: 'screenSM',
  /** 超小屏幕 (<576px) - 手机 */
  SCREEN_XS: 'screenXS',
}

/**
 * 平板一下的尺寸名称
 */
export const PAD_SCREENS: readonly string[] = [
  SCREEN_BREAKPOINT.SCREEN_LG,
  SCREEN_BREAKPOINT.SCREEN_MD,
  SCREEN_BREAKPOINT.SCREEN_SM,
  SCREEN_BREAKPOINT.SCREEN_XS,
]

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
  PASSWORD:
    /^(?!^[0-9a-z]+$)(?!^[0-9A-Z]+$)(?!^[0-9\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[a-zA-Z]+$)(?!^[a-z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)[a-z0-9A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$/,
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
