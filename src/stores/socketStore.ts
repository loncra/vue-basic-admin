import {computed, ref, type Ref} from 'vue'
import {defineStore} from 'pinia'
import {io, type Socket} from 'socket.io-client'
import {STORE} from '@/constants/systemConstant'
import {usePrincipalStore} from '@/stores/principalStore'
import {
  type SocketBusinessEvent,
  type SocketBusinessEventPayloadMap,
  type SocketConnectionStatus,
} from '@/types/socket'
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";

type SocketHandler = (...args: unknown[]) => void

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
        instance.on(event, handler as (...args: any[]) => void)
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

  function createSocketInstance(token: string): void {
    const retryTimeout = Number(import.meta.env.VITE_APP_SOCKET_RETRY_TIMEOUT) || 1000
    const retryCount = Number(import.meta.env.VITE_APP_SOCKET_RETRY_COUNT) || 3

    const deviceIdStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_DEVICE_IDENTIFIED_NAME
    const accessTokenName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    const deviceId = localStorage.getItem(deviceIdStorageName)

    const instance = io({
      query: {
        t: String(Date.now()),
        [deviceIdStorageName]: deviceId,
        [accessTokenName]: token,
      },
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

  /**
   * 幂等连接：有 token 且未连接或 token 变更则建连
   */
  function ensureConnected(): void {
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
    createSocketInstance(token)
  }

  /**
   * 断开 Socket 连接，保留 handler registry
   */
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
    socket.value?.on(event as string, wrapped as (...args: any[]) => void)
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

  return {
    connectError,
    status,
    isConnected,
    ensureConnected,
    disconnect,
    subscribe,
    unsubscribe,
    emit,
  }
})
