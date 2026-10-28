import type {
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from '@/types/apis'
import type {IdValueMetadata, RestResult} from '@loncra/client/commons'
import type {PlatformUser} from '@loncra/client/auth'
import type {UserChatCallEntity, UserChatCallParticipantEntity} from '@loncra/client/message'
import {SOCKET_EVENT_TYPE} from '@/constants';

export type SocketBusinessEventPayloadMap = {
  [SOCKET_EVENT_TYPE.RUN_COMMAND]: RestResult<string>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE]: RestResult<UserChatMessageResponseBody>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION]: RestResult<UserChatMessageResponseBody>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ]: RestResult<UserChatMessageResponseBody>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE_UNDO]: RestResult<UserChatMessageEntity>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE_UPDATE]: RestResult<UserChatMessageResponseBody>
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ_UPDATE]: RestResult<IdValueMetadata<number, number>[]>

  [SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH]: RestResult<number>
  [SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID]: RestResult<number>
  [SOCKET_EVENT_TYPE.CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID]: RestResult<number>

  [SOCKET_EVENT_TYPE.CHAT_CONVERSATION_CREATE]: RestResult<UserChatConversationResponseBody>

  [SOCKET_EVENT_TYPE.CHAT_CALL]: RestResult<IdValueMetadata<number, PlatformUser>>
  [SOCKET_EVENT_TYPE.CHAT_CALL_UPDATE]: RestResult<UserChatCallEntity>
  [SOCKET_EVENT_TYPE.CHAT_CALL_COMPLETED]: RestResult<UserChatCallEntity>
  [SOCKET_EVENT_TYPE.CHAT_CALL_CONFIRM]: RestResult<UserChatCallParticipantEntity>
  [SOCKET_EVENT_TYPE.CHAT_CALL_PARTICIPANT_UPDATE]: RestResult<UserChatCallParticipantEntity>
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
