import type {VideoMetrics} from "@/types/composables";
import {
  USER_CHAT_CALL_PARTICIPANT_STATUS,
  USER_CHAT_PARTICIPANT_TYPE
} from "@/constants/variableConstant.ts";

export const MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY = "setExtraContent"
export const USER_CHAT_CONTEXT_PROVIDE_KEY = "userChatContext"
export const CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY = "chatCallModalExpose"
export const CHAT_CALL_MEDIA_PROVIDE_KEY = "chatCallMedia"

/**
 * 消息分组
 */
export const MESSAGE_GROUP = {
  DEFAULT: "default",
  SITE: 'site',
  USER_CHAT: 'userChat',
  USER_CHAT_CALL: 'userChatCall'
} as const

/** 对齐后端 UserChatParticipantTypeEnum.OWNER_TYPE（群主 + 管理员） */
export const USER_CHAT_PARTICIPANT_OWNER_TYPE_VALUE: ReadonlyArray<number> = [
  USER_CHAT_PARTICIPANT_TYPE.OWNER,
  USER_CHAT_PARTICIPANT_TYPE.CO_OWNER,
]

export const USER_CHAT_CALL_PARTICIPANT_ERROR_STATUS_VALUE: ReadonlyArray<number> = [
  USER_CHAT_CALL_PARTICIPANT_STATUS.COMPLETED,
  USER_CHAT_CALL_PARTICIPANT_STATUS.REJECTED,
  USER_CHAT_CALL_PARTICIPANT_STATUS.CANCELED,
  USER_CHAT_CALL_PARTICIPANT_STATUS.DIS_CONNECTION,
]

export const USER_CHAT_CALL_PARTICIPANT_PROCESSING_STATUS_VALUE: ReadonlyArray<number> = [
  USER_CHAT_CALL_PARTICIPANT_STATUS.INITIATING,
  USER_CHAT_CALL_PARTICIPANT_STATUS.RINGING,
  USER_CHAT_CALL_PARTICIPANT_STATUS.CONNECTING,
]


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

export const CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE = {
  DEFAULT:"default",
  LEFT_RIGHT:"leftRight"
} as const

export const CHAT_CALL_PRIVATE_ROLE_TYPE = {
  LOCAL: "local",
  REMOTE: "remote",
}

/** 通话外壳展示：展开 Modal / 最小化浮动窗 */
export const CHAT_CALL_UI_MODE = {
  EXPANDED: 'expanded',
  MINIMIZED: 'minimized',
} as const

/** 最小化浮动窗尺寸（16:9） */
export const CHAT_CALL_MINI_SIZE = {
  WIDTH: 280,
  HEIGHT: 158,
} as const

export const PIP_WIDTH_RATIO = 0.28
export const PIP_MAX_WIDTH_PX = 200
/** 无真实视频流时用于布局计算的默认宽高（与 PREVATE 约束 ideal 一致） */
export const PRIVATE_VIDEO_LAYOUT_METRICS: VideoMetrics = {width: 1280, height: 720, aspect: 16 / 9}

export const MESSAGE_SERVER_BATCH_AUTHORITY = {
  DELETE: 'perms[message_server_batch:delete]',
  GET: 'perms[message_server_batch:get]',
  EXPORT: 'perms[message_server_batch:export]',
} as const

export const MESSAGE_SERVER_EMAIL_AUTHORITY = {
  DELETE: 'perms[message_server_email:delete]',
  GET: 'perms[message_server_email:get]',
  EXPORT: 'perms[message_server_email:export]',
  SEND:'perms[message_server_email:send]',
} as const

export const MESSAGE_SERVER_SITE_AUTHORITY = {
  DELETE: 'perms[message_server_site:delete]',
  GET: 'perms[message_server_site:get]',
  EXPORT: 'perms[message_server_site:export]',
  SEND:'perms[message_server_site:send]',
} as const

export const MESSAGE_SERVER_SMS_AUTHORITY = {
  DELETE: 'perms[message_server_sms:delete]',
  GET: 'perms[message_server_sms:get]',
  EXPORT: 'perms[message_server_sms:export]',
  SEND:'perms[message_server_sms:send]',
} as const

export const MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY = {
  FIND:'perms[message_server_sms_template:find]',
  GET:'perms[message_server_sms_template:get]',
} as const

export const MESSAGE_SERVER_SMS_SIGN_AUTHORITY = {
  FIND:'perms[message_server_sms_sign:find]',
  GET:'perms[message_server_sms_sign:get]',
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
