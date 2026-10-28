export const APP_RELOAD_PROVIDE_KEY = 'reload'
export const LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY = "closeContentTab"
export const LAYOUT_PANE_TITLE_PROVIDE_KEY = "paneTitle"

export const SYSTEM_ROUTE = {
  ROOT: 'root',
  HOME_PAGE: import.meta.env.VITE_APP_HOME_PAGE_NAME,
  WORKBENCH: import.meta.env.VITE_APP_HOME_ROUTE_PAGE_NAME,
  AUTH: import.meta.env.VITE_APP_AUTH_PAGE_NAME,
  FORGOT_PASSWORD: 'forgot_password',
  NOT_FOUND: '404',
  FORBIDDEN: '403',
  BAD_REQUEST: '400',
  SETTING: 'setting',
  AGENT: 'agent',
  MY_MESSAGE: 'my_message',
  MY_SITE_MESSAGE: 'my_site_message',
  MY_CHAT_MESSAGE: 'my_chat_message',
} as const

export const STORE = {
  CONFIG_PROVIDER_ID: 'configProvider',
  PRINCIPAL_ID: 'principal',
  MESSAGE_SERVER_ID: 'messageServer',
  SOCKET_ID: 'socket',
  MENU_ID: 'menu',
  BOOT_ID: 'boot',
} as const

export const HTTP = {
  SUCCESS_EXECUTE_CODES: ['200'],
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
  HEADER: {
    ACCEPT: 'Accept',
    CACHE_CONTROL: 'Cache-Control',
    CONTENT_TYPE: 'Content-Type',
  },
  CONTENT_TYPE: {
    EVENT_STREAM: 'text/event-stream',
    JSON: 'application/json',
  },
  CACHE_CONTROL: {
    NO_CACHE: 'no-cache',
  },
} as const

export const VALID_REGX = {
  PHONE_NUMBER: /^1[3456789]\d{9}$/,
  PASSWORD: /^(?!^[0-9a-z]+$)(?!^[0-9A-Z]+$)(?!^[0-9\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[a-zA-Z]+$)(?!^[a-z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)(?!^[A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$)[a-z0-9A-Z\x21-\x2f\x3a-\x40\x5b-\x60\x7B-\x7F]+$/,
  ILLEGAL_FILE_OR_FOLDER_NAME: /[\u0000-\u001f\u007f/\\<>"|?*]/
} as const

export const DATE_TIME_FORMAT = {
  POST_TIMESTAMP_FORMAT: import.meta.env.VITE_APP_POST_TIMESTAMP_FORMAT,
  POST_TIME_FORMAT: import.meta.env.VITE_APP_POST_TIME_FORMAT
} as const



