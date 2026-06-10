
export const MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY = "setExtraContent"
export const TYPING_ANCHOR = '\u200B'
/**
 * 消息分组
 */
export const MESSAGE_GROUP = {
  SITE: 'site',
  USER_CHAT: 'userChat'
} as const

/** Socket.IO 事件名 */
export const SOCKET_EVENT_TYPE = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',
  CONNECT_TIMEOUT: 'connect_timeout',
  CLIENT_DISCONNECT: 'client_disconnect',
  /** 服务端推送的执行系统命令事件，payload 为 RestResult<string> */
  RUN_COMMAND: 'run_command',
  CHAT_MESSAGE: 'chat_message',
  CHAT_MESSAGE_READ:'chat_message_read',
  CHAT_MESSAGE_READ_UPDATE:'chat_message_read_update',
  CHAT_ROOM_JOIN:'chat_room_join',
  CHAT_ROOM_RENAME:'chat_room_rename',
  CHAT_CONVERSATION_CREATE:'chat_conversation_create',
} as const
