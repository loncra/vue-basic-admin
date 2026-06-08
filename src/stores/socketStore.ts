import {computed, ref, type Ref} from 'vue'
import {defineStore} from 'pinia'
import {io, type Socket} from 'socket.io-client'
import {SOCKET_EVENT_TYPE, STORE} from '@/constants/systemConstant'
import {usePrincipalStore} from '@/stores/principalStore'

export const useSocketStore = defineStore(STORE.SOCKET_ID, () => {
  const principalStore = usePrincipalStore()
  const socket: Ref<Socket | null> = ref(null)
  const connected: Ref<boolean> = ref(false)
  const connectError: Ref<string | null> = ref(null)

  const isConnected = computed(() => connected.value)

  /**
   * 建立 Socket 连接
   * 从 localStorage 读取 accessToken，需在登录成功后调用
   */
  function connect(): void {
    const token = principalStore.state.details?.token?.value
    if (!token) {
      connectError.value = '未找到 accessToken，请先登录'
      return
    }

    // 已连接且 token 未变，跳过
    if (socket.value?.connected) {
      return
    }

    // 已有实例但未连接，先断开
    if (socket.value) {
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
    }

    connectError.value = null

    const retryTimeout = Number(import.meta.env.VITE_APP_SOCKET_RETRY_TIMEOUT) || 1000
    const retryCount = Number(import.meta.env.VITE_APP_SOCKET_RETRY_COUNT) || 3

    const deviceIdStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_DEVICE_IDENTIFIED_NAME
    const accessTokenName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    const deviceId = localStorage.getItem(deviceIdStorageName)

    //const baseUrl = getApiBaseUrl()
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

    instance.on(SOCKET_EVENT_TYPE.CONNECT, () => {
      connected.value = true
      connectError.value = null
    })

    instance.on(SOCKET_EVENT_TYPE.DISCONNECT, () => {
      connected.value = false
    })

    instance.on(SOCKET_EVENT_TYPE.CONNECT_ERROR, (err: Error) => {
      connected.value = false
      connectError.value = err?.message || '连接失败'
    })

    instance.on(SOCKET_EVENT_TYPE.CONNECT_TIMEOUT, () => {
      connected.value = false
      connectError.value = '连接超时'
    })

    socket.value = instance
  }

  /**
   * 断开 Socket 连接
   */
  function disconnect(): void {
    if (socket.value) {
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
    }
    connected.value = false
    connectError.value = null
  }

  /**
   * 监听服务端事件
   */
  function on(event: string, callback: (payload: string, callback:() => void) => void): void {
    socket.value?.on(event, callback)
  }

  /**
   * 取消监听
   */
  function off(event: string, callback: (payload: string, callback:() => void) => void): void {
    if (callback) {
      socket.value?.off(event, callback)
    } else {
      socket.value?.off(event)
    }
  }

  /**
   * 向服务端发送事件
   */
  function emit(event: string, ...args: unknown[]): void {
    socket.value?.emit(event, ...args)
  }

  return {
    socket,
    connected,
    connectError,
    isConnected,
    connect,
    disconnect,
    on,
    off,
    emit,
  }
})
