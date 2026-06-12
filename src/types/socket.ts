import type {
  IdValueMetadata,
  RestResult,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from '@/types/apis'
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";


/** 仅业务推送事件；传输层事件由 store 内部 bindInternalListeners 处理 */
export type SocketBusinessEventPayloadMap = {
  [SOCKET_EVENT_TYPE.RUN_COMMAND]: RestResult<string>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE]: RestResult<UserChatMessageEntity>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ]: RestResult<UserChatMessageResponseBody>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ_UPDATE]: RestResult<IdValueMetadata<number, number>[]>

  [SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH]: RestResult<number>
  [SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID]: RestResult<number>
  [SOCKET_EVENT_TYPE.CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID]: RestResult<number>

  [SOCKET_EVENT_TYPE.CHAT_CONVERSATION_CREATE]: RestResult<UserChatConversationResponseBody>
}

export type SocketBusinessEvent = keyof SocketBusinessEventPayloadMap

export type SocketConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export function parseSocketRestPayload<T>(payload: unknown): RestResult<T> {
  return typeof payload === 'string' ? JSON.parse(payload) : (payload as RestResult<T>)
}
