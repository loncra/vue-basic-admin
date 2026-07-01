export const MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY = "setExtraContent"

/**
 * 消息分组
 */
export const MESSAGE_GROUP = {
  SITE: 'site',
  USER_CHAT: 'userChat'
} as const


export const CHAAT_ROOM_VIEW_MODAL_TYPE = {
  ADD_PARTICIPANT: 'addParticipant',
  MEMBER_SETTING: 'memberSetting',
  HISTORIES: 'histories',
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
  CHAT_MESSAGE_MENTION: 'chat_message_mention',
  CHAT_MESSAGE_READ:'chat_message_read',
  CHAT_MESSAGE_UNDO:'chat_message_undo',
  CHAT_MESSAGE_READ_UPDATE:'chat_message_read_update',

  CHAT_CONVERSATION_CREATE:'chat_conversation_create',

  CHAT_CONVERSATION_REFRESH:'chat_conversation_refresh',
  CHAT_CONVERSATION_REFRESH_BY_ROOM_ID:'chat_conversation_refresh_by_room_id',
  CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID:'chat_participant_refresh_by_room_id'
} as const

export const CHAT_BUBBLE_TYPE = {
  AI:'ai',
  SYSTEM:'system',
  USER:'user',
  DIVIDER:"divider"
}

export const CAPTCHA_TOKEN_TYPE = {
  SMS:'sms',
  EMAIL:'email',
  TIANAI:'tianai'
}

export const CHAT_EVERYONE_ID = 'EVERYONE'

export const VIDEO_CHAT_CONSTRAINTS = {
  /** 1v1：清晰度优先 */
  PREVATE: {
    video: {
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
  /** 群聊：省带宽/CPU，小窗够用 */
  GROUP: {
    video: {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      facingMode: 'user',
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
} satisfies Record<string, MediaStreamConstraints>

export const CHAT_CALL_TYPE = {
  VIDEO:"10",
  VOICE:"20"
} as const
