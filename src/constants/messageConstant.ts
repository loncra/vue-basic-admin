export const MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY = "setExtraContent"

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
  CHAT_MESSAGE_MENTION: 'chat_message_mention',
  CHAT_MESSAGE_READ:'chat_message_read',
  CHAT_MESSAGE_UNDO:'chat_message_undo',
  CHAT_MESSAGE_UPDATE:'chat_message_update',
  CHAT_MESSAGE_READ_UPDATE:'chat_message_read_update',

  CHAT_CALL:'chat_call',
  CHAT_CALL_UPDATE:'chat_call_update',
  CHAT_CALL_COMPLETED:'chat_call_completed',
  CHAT_CALL_CONFIRM:'chat_call_confirm',
  CHAT_CALL_PARTICIPANT_UPDATE:'chat_call_participant_update',

  CHAT_CONVERSATION_CREATE:'chat_conversation_create',

  CHAT_CONVERSATION_REFRESH:'chat_conversation_refresh',
  CHAT_CONVERSATION_REFRESH_BY_ROOM_ID:'chat_conversation_refresh_by_room_id',
  CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID:'chat_participant_refresh_by_room_id'
} as const

export const MESSAGE_SERVER_BATCH_ROUTE = {
  HOME: 'message_server_batch',
  DETAIL: 'message_server_batch_detail',
} as const

export const MESSAGE_SERVER_EMAIL_ROUTE = {
  HOME: 'message_server_email',
  SEND: 'message_server_email_send',
  DETAIL: 'message_server_email_detail',
} as const

export const MESSAGE_SERVER_SITE_ROUTE = {
  HOME: 'message_server_site',
  SEND: 'message_server_site_send',
  DETAIL: 'message_server_site_detail',
} as const

export const MESSAGE_SERVER_SMS_ROUTE = {
  HOME: 'message_server_sms',
  TEMPLATE: 'message_server_sms_template',
  SIGN: 'message_server_sms_sign',
  SEND: 'message_server_sms_send',
  DETAIL: 'message_server_sms_detail',
} as const
