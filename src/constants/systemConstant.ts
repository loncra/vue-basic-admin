export const APP_RELOAD_PROVIDE_KEY = 'reload'
export const LAYOUT_CONTENT_CLOSE_TAB_KEY = "closeContentTab"

export const SYSTEM_CONSTANT = {
  ID_NAME: 'id'
} as const

/**
 * 系统所有 store 的 id
 */
export const STORE = {
  CONFIG_PROVIDER_ID: 'configProvider',
  PRINCIPAL_ID: 'principal',
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
    system: 'icon-setting',
    dark: 'icon-dark',
    light: 'icon-light',
  },
} as const

/**
 * 整体标准化配置相关
 */
export const CONFIG_PROVIDER = {
  MATCH_MEDIA_QUERY: '(prefers-color-scheme: dark)',
  STORED_STATE_VALUE: {
    mode: CONFIG_PROVIDER_THEME.SYSTEM,
    collapsedWidth: 84,
    collapsible: false,
    formLayout: 'vertical',
    homeSiderWidth: 260,
  },
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
 * 屏幕断点类型
 * 用于类型检查和自动补全
 */
export type ScreenBreakpoint = (typeof SCREEN_BREAKPOINT)[keyof typeof SCREEN_BREAKPOINT]

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
}

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
}

/**
 * 验证正则表达式集合
 */
export const VALID_REGX = {
  phoneNumber: /^1[3456789]\d{9}$/,
  password:
    /^(?!^[0-9a-z]+$)(?!^[0-9A-Z]+$)(?!^[0-9\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[a-zA-Z]+$)(?!^[a-z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)[a-z0-9A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$/,
}

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
