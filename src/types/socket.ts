import type { RestResult, UserChatMessageEntity } from '@/types/apis'

/** Socket.IO 事件名 */
export const SOCKET_EVENT_TYPE = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',
  CONNECT_TIMEOUT: 'connect_timeout',
  CLIENT_DISCONNECT: 'client_disconnect',
  CHAT_MESSAGE: 'chat_message',
  /** 服务端推送的执行系统命令事件，payload 为 RestResult<string> */
  RUN_COMMAND: 'run_command',
} as const

/** 仅业务推送事件；传输层事件由 store 内部 bindInternalListeners 处理 */
export type SocketBusinessEventPayloadMap = {
  [SOCKET_EVENT_TYPE.CHAT_MESSAGE]: RestResult<UserChatMessageEntity>
  [SOCKET_EVENT_TYPE.RUN_COMMAND]: RestResult<string>
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
