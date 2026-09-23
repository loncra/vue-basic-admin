export const APP_RELOAD_PROVIDE_KEY = 'reload'
export const LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY = "closeContentTab"
export const LAYOUT_PANE_TITLE_PROVIDE_KEY = "paneTitle"

export {OPERATION_DATA_TRACE_TABLE, SYSTEM_CONSTANT, SYSTEM_MODULE_NAME} from '@loncra/client/commons'

/**
 * **系统级基础页面的路由名**（`routers/index.ts` 里 `childrenRoutes` / `routes` 那些不属于任何业务模块的页面）。
 *
 * 页面里要跳到这些页面时用这里的常量：
 * `router.push({name: SYSTEM_ROUTE.BAD_REQUEST})` —— 不要再各写一份 `'400'` 这种魔法值
 * （以前 `useRequiredQuery.ts` 里就单独抄了一份 `BAD_REQUEST_ROUTE_NAME = '400'`）。
 *
 * 三个来自环境变量的（首页壳 / 首页落地页 / 认证页）也收在这里：
 * 它们**既是路由名、也是路径段**，以后改名只该动环境变量 + 这一处。
 */
export const SYSTEM_ROUTE = {
  /** 根路径：只做重定向，没有页面 */
  ROOT: 'root',
  /** 首页壳（动态路由都挂在它下面） */
  HOME_PAGE: import.meta.env.VITE_APP_HOME_PAGE_NAME,
  /** 首页默认落地页：工作台（根路径重定向到它） */
  WORKBENCH: import.meta.env.VITE_APP_HOME_ROUTE_PAGE_NAME,
  /** 认证页（路径段与路由名同名） */
  AUTH: import.meta.env.VITE_APP_AUTH_PAGE_NAME,
  /** 忘记密码 */
  FORGOT_PASSWORD: 'forgot_password',
  /** 错误页：404 / 403 / 400 */
  NOT_FOUND: '404',
  FORBIDDEN: '403',
  BAD_REQUEST: '400',
  /** 系统设置 */
  SETTING: 'setting',
  /** AI 智能体 */
  AGENT: 'agent',
  /** 我的消息：父级只做重定向，两个子页按「站内 / 会话」分 */
  MY_MESSAGE: 'my_message',
  MY_SITE_MESSAGE: 'my_site_message',
  MY_CHAT_MESSAGE: 'my_chat_message',
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
  BOOT_ID: 'boot',
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
  POST_TIMESTAMP_FORMAT: import.meta.env.VITE_APP_POST_TIMESTAMP_FORMAT,
  POST_TIME_FORMAT: import.meta.env.VITE_APP_POST_TIME_FORMAT
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

export {
  AVATAR_SCHEMES,
  ICON_SELECT_AVATAR_MODE_VALUE,
  ICON_SELECT_MODE,
} from '@loncra/antdv'

