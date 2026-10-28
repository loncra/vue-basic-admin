import {onUnmounted} from 'vue'
import {useSocketStore} from '@/stores/socketStore'
import type {SocketBusinessEvent, SocketBusinessEventPayloadMap} from '@/types/socket'

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
