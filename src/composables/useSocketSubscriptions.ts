import {onUnmounted} from 'vue'
import {useSocketStore} from '@/stores/socketStore'
import type {SocketBusinessEvent, SocketBusinessEventPayloadMap} from '@/types/socket'

/**
 * 统一管理 socket 业务事件订阅：注册后自动收集 dispose，组件卸载时统一清理，
 * 取代各组件重复的 socketListener.push(...) + onUnmounted(forEach) 模板。
 */
export function useSocketSubscriptions() {
  const socketStore = useSocketStore()
  const disposers: Array<() => void> = []

  function on<E extends SocketBusinessEvent>(
    event: E,
    handler: (payload: SocketBusinessEventPayloadMap[E]) => void,
  ): () => void {
    const dispose = socketStore.subscribe(event, handler)
    disposers.push(dispose)
    return dispose
  }

  function dispose(): void {
    disposers.splice(0).forEach((d) => d())
  }

  onUnmounted(dispose)

  return {on, dispose}
}
