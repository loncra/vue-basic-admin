import {onUnmounted, type Ref} from 'vue'
import type {AbstractXRequestClass, SSEOutput} from '@antdv-next/x-sdk'
import {AgentService} from '@/apis'
import {AGENT_CHAT_STATUS, AGENT_SSE_EVENT, CHAT_BUBBLE_TYPE,} from '@/constants'
import type {
  ActiveAgentConversationItem,
  AgentStreamApi,
  AgentStreamPayload,
  ChatBubbleItem,
  ChatContentBlock,
} from '@/types/composables'
import type {AgentMessageEntity} from '@/types/apis'
import {getEnumValue} from '@/utils'

/**
 * 订阅助手 SSE，并把 snapshot/patch/done 写回气泡列表。
 */
export function useAgentStream(
  conversationActive: Ref<ActiveAgentConversationItem | undefined>,
): AgentStreamApi {
  let currentRequest: AbstractXRequestClass<Record<string, never>, SSEOutput> | undefined
  let currentAssistantId: number | undefined

  function disconnect(): void {
    currentRequest?.abort()
    currentRequest = undefined
    currentAssistantId = undefined
  }

  function applyPayload(payload: AgentStreamPayload, done: boolean): void {
    const active = conversationActive.value
    if (!active) {
      return
    }
    const key = String(payload.assistantId)
    const bubble = active.dataSource.elements.find((item) => String(item.key) === key)
    if (!bubble) {
      return
    }
    const content = (payload.content ?? []) as ChatContentBlock[]
    bubble.content = content
    if (bubble.data) {
      const data = bubble.data as AgentMessageEntity
      data.content = content
      if (payload.status !== undefined) {
        data.status = payload.status
      }
      if (payload.version !== undefined) {
        data.version = payload.version
      }
      if (payload.metadata !== undefined) {
        data.metadata = payload.metadata
      }
    } else {
      bubble.data = {
        id: payload.assistantId,
        content,
        status: payload.status ?? AGENT_CHAT_STATUS.RUNNING,
        version: payload.version,
        metadata: payload.metadata,
      } as AgentMessageEntity
    }
    if (done) {
      active.loading = false
      if (payload.status !== undefined) {
        active.status = payload.status
      } else {
        active.status = AGENT_CHAT_STATUS.COMPLETED
      }
    }
  }

  function connect(assistantId: number): void {
    if (currentAssistantId === assistantId && currentRequest?.isRequesting) {
      return
    }
    disconnect()
    currentAssistantId = assistantId
    const active = conversationActive.value
    if (active) {
      active.loading = true
    }
    currentRequest = AgentService.loadStream(assistantId, {
      onEvent: (eventName, payload) => {
        if (eventName === AGENT_SSE_EVENT.DONE) {
          applyPayload(payload, true)
          disconnect()
          return
        }
        applyPayload(payload, false)
      },
      onSuccess: () => {
        if (conversationActive.value?.loading) {
          conversationActive.value.loading = false
        }
        disconnect()
      },
      onError: () => {
        if (conversationActive.value?.loading) {
          conversationActive.value.loading = false
        }
        disconnect()
      },
    })
  }

  function reconnectIfRunning(): void {
    const active = conversationActive.value
    if (!active) {
      disconnect()
      return
    }
    const running = findLatestRunningAssistant(active.dataSource.elements)
    if (!running) {
      disconnect()
      return
    }
    const assistantId = Number(running.key)
    if (!Number.isFinite(assistantId)) {
      return
    }
    connect(assistantId)
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    reconnectIfRunning,
  }
}

function findLatestRunningAssistant(elements: ChatBubbleItem[]): ChatBubbleItem | undefined {
  for (let i = elements.length - 1; i >= 0; i--) {
    const item = elements[i]
    if (!item || item.role !== CHAT_BUBBLE_TYPE.AI) {
      continue
    }
    const status = getEnumValue((item.data as AgentMessageEntity)?.status as number | undefined)
    if (Number(status) === AGENT_CHAT_STATUS.RUNNING) {
      return item
    }
  }
  return undefined
}

export type AgentStreamComposableApi = ReturnType<typeof useAgentStream>
