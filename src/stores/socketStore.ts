import {computed, ref, type Ref} from 'vue'
import {defineStore} from 'pinia'
import {io, type Socket} from 'socket.io-client'
import {invoke} from '@tauri-apps/api/core'
import {EXECUTE_SHELL_QUERY_NAME, SOCKET_EVENT_TYPE, STORE} from '@/constants'
import {isTauri} from '@/utils/common'
import {usePrincipalStore} from '@/stores/principalStore'
import type {IdValueMetadata, RestResult} from '@loncra/client/commons'
import type {PlatformUser} from '@loncra/client/auth'
import type {
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from '@loncra/client/message'

export type SocketBusinessEventPayloadMap = {
  [SOCKET_EVENT_TYPE.RUN_COMMAND]: RestResult<string>
  [SOCKET_EVENT_TYPE.AGENT_FILESYSTEM_REQUEST]: RestResult<{
    operation: string
    params: Record<string, unknown>
  }>
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

type SocketHandler = (...args: unknown[]) => void

export type SocketAckHandler<P> = (payload: P, ack: (result: unknown) => void) => void

export const useSocketStore = defineStore(STORE.SOCKET_ID, () => {
  const principalStore = usePrincipalStore()
  const socket: Ref<Socket | null> = ref(null)
  const connected: Ref<boolean> = ref(false)
  const connectError: Ref<string | null> = ref(null)
  const status: Ref<SocketConnectionStatus> = ref('idle')
  const lastToken: Ref<string | null> = ref(null)

  const handlerRegistry = new Map<string, Set<SocketHandler>>()

  const isConnected = computed(() => connected.value)

  function addToRegistry(event: string, handler: SocketHandler): void {
    let handlers = handlerRegistry.get(event)
    if (!handlers) {
      handlers = new Set()
      handlerRegistry.set(event, handlers)
    }
    handlers.add(handler)
  }

  function removeFromRegistry(event: string, handler?: SocketHandler): void {
    if (!handler) {
      handlerRegistry.delete(event)
      return
    }
    const handlers = handlerRegistry.get(event)
    handlers?.delete(handler)
    if (handlers?.size === 0) {
      handlerRegistry.delete(event)
    }
  }

  function attachHandlerRegistry(instance: Socket): void {
    for (const [event, handlers] of handlerRegistry) {
      for (const handler of handlers) {
        instance.on(event, handler as (...args: unknown[]) => void)
      }
    }
  }

  function bindInternalListeners(instance: Socket): void {
    instance.on(SOCKET_EVENT_TYPE.CONNECT, () => {
      connected.value = true
      status.value = 'connected'
      connectError.value = null
    })

    instance.on(SOCKET_EVENT_TYPE.DISCONNECT, () => {
      connected.value = false
      status.value = 'disconnected'
    })

    instance.on(SOCKET_EVENT_TYPE.CONNECT_ERROR, (err: Error) => {
      connected.value = false
      status.value = 'error'
      connectError.value = err?.message || '连接失败'
    })

    instance.on(SOCKET_EVENT_TYPE.CONNECT_TIMEOUT, () => {
      connected.value = false
      status.value = 'error'
      connectError.value = '连接超时'
    })
  }

  function destroySocketInstance(): void {
    if (socket.value) {
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
    }
  }

  async function createSocketInstance(token: string): Promise<void> {
    const retryTimeout = Number(import.meta.env.VITE_APP_SOCKET_RETRY_TIMEOUT) || 1000
    const retryCount = Number(import.meta.env.VITE_APP_SOCKET_RETRY_COUNT) || 3

    const deviceIdStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_DEVICE_IDENTIFIED_NAME
    const accessTokenName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    const deviceId = localStorage.getItem(deviceIdStorageName)

    const query: Record<string, string> = {
      t: String(Date.now()),
      [deviceIdStorageName]: deviceId ?? '',
      [accessTokenName]: token,
    }

    if (isTauri()) {
      try {
        query[EXECUTE_SHELL_QUERY_NAME] = String(await invoke('system_shell'))
      } catch (error) {
        console.warn('[socket] collect execute shell failed', error)
      }
    }

    const instance = io({
      query,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: retryCount,
      reconnectionDelay: retryTimeout,
      timeout: 10000,
    })

    bindInternalListeners(instance)
    attachHandlerRegistry(instance)
    socket.value = instance
  }

  async function ensureConnected(): Promise<void> {
    const token = principalStore.state.details?.token?.value
    if (!token) {
      status.value = 'idle'
      connectError.value = '未找到 accessToken，请先登录'
      return
    }

    if (socket.value?.connected && lastToken.value === token) {
      return
    }

    if (socket.value) {
      destroySocketInstance()
    }

    lastToken.value = token
    status.value = 'connecting'
    connectError.value = null
    await createSocketInstance(token)
  }

  function disconnect(): void {
    destroySocketInstance()
    connected.value = false
    status.value = 'disconnected'
    connectError.value = null
    lastToken.value = null
  }

  function subscribe<E extends SocketBusinessEvent>(
    event: E,
    handler: (payload: SocketBusinessEventPayloadMap[E]) => void,
  ): () => void {
    const wrapped: SocketHandler = (payload: unknown) => {
      handler(payload as SocketBusinessEventPayloadMap[E])
    }
    addToRegistry(event, wrapped)
    socket.value?.on(event as string, wrapped as (...args: unknown[]) => void)
    return () => unsubscribe(event, wrapped)
  }

  function unsubscribe(event: string, handler?: SocketHandler): void {
    if (handler) {
      removeFromRegistry(event, handler)
      socket.value?.off(event, handler)
      return
    }

    const handlers = handlerRegistry.get(event)
    if (handlers && socket.value) {
      for (const registeredHandler of handlers) {
        socket.value.off(event, registeredHandler)
      }
    }
    removeFromRegistry(event)
  }

  function emit(event: string, ...args: unknown[]): void {
    socket.value?.emit(event, ...args)
  }

  function ackSubscribe<E extends SocketBusinessEvent>(
    event: E,
    handler: SocketAckHandler<SocketBusinessEventPayloadMap[E]>,
  ): () => void {
    const wrapped: SocketHandler = (...args: unknown[]) => {
      const ack = args[args.length - 1]
      if (typeof ack !== 'function') {
        return
      }
      handler(args[0] as SocketBusinessEventPayloadMap[E], ack as (result: unknown) => void)
    }
    addToRegistry(event, wrapped)
    socket.value?.on(event as string, wrapped)
    return () => unsubscribe(event, wrapped)
  }

  return {
    connectError,
    status,
    isConnected,
    ensureConnected,
    disconnect,
    subscribe,
    unsubscribe,
    ackSubscribe,
    emit,
  }
})
