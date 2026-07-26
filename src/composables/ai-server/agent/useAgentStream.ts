import {onUnmounted, type Ref} from 'vue'
import type {AbstractXRequestClass, SSEOutput} from '@antdv-next/x-sdk'
import {AgentService} from '@/apis'
import {AGENT_CHAT_STATUS, AGENT_CONTENT_TYPE, CHAT_BUBBLE_TYPE,} from '@/constants'
import type {
  ActiveAgentConversationItem,
  AgentConversationItem,
  AgentSseMessageContent,
  AgentStatusChangeSse,
  AgentStreamApi,
  AgentTextMessageContent,
  ChatBubbleItem,
} from '@/types/composables'
import type {AgentMessageEntity} from '@/types/apis'
import {findFirstTreeNode, getEnumValue} from '@/utils'

const TEXT_TYPES: ReadonlyArray<AgentSseMessageContent['type']> = [
  AGENT_CONTENT_TYPE.THINK,
  AGENT_CONTENT_TYPE.ANSWER,
  AGENT_CONTENT_TYPE.ERROR,
]

const AGENT_STATUS_CHANGE_TYPE: Readonly<AgentSseMessageContent['type']> = AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE

/**
 * 订阅助手 SSE
 */
export function useAgentStream(
  conversationActive: Ref<ActiveAgentConversationItem | undefined>,
  conversations: Ref<AgentConversationItem[]>
): AgentStreamApi {
  let currentRequest: AbstractXRequestClass<Record<string, never>, SSEOutput> | undefined
  let currentAssistantId: number | undefined

  function disconnect(): void {
    currentRequest?.abort()
    currentRequest = undefined
    currentAssistantId = undefined
  }

  function completed() {
    if (conversationActive.value?.loading) {
      conversationActive.value.loading = false
    }
    disconnect()
  }

  function onEvent(chunk: Partial<SSEOutput>, assistantId:number) {
    const active = conversationActive.value
    if (!active) {
      return
    }
    const bubble = active.dataSource
      .elements
      .find(item => item.key === String(assistantId))
    if (!bubble) {
      return
    }

    const sseData:AgentSseMessageContent = JSON.parse(chunk.data)
    const ALL_CONTENT_TYPES = Object.values(AGENT_CONTENT_TYPE) as string[]
    if (!ALL_CONTENT_TYPES.includes(sseData.type)) {
      return
    }

    if (TEXT_TYPES.includes(sseData.type)) {
      const content = bubble.content as AgentSseMessageContent[]
      if (!content.some(s => s.id === sseData.id)) {
        content.push(sseData)
      } else {
        appendTextMessageContent(sseData as AgentTextMessageContent, content)
      }
    } else if (AGENT_STATUS_CHANGE_TYPE === sseData.type) {
      updateConversationStatus(sseData as AgentStatusChangeSse)
    }
  }

  function updateConversationStatus(sse: AgentStatusChangeSse) {
    const active = conversationActive.value
    if (!active || String(active.id) !== sse.id) {
      return
    }
    active.status = sse.status
    const item = findFirstTreeNode(s => s.id === active.id, conversations.value);
    if (item) {
      item.status = sse.status
    }
  }

  function appendTextMessageContent(chunk: AgentTextMessageContent, content: AgentSseMessageContent[]){
    const find = content.find(s => s.id === chunk.id)
    if (!find) {
      return
    }
    (find as AgentTextMessageContent).value += (chunk as AgentTextMessageContent).value || ""
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
      onUpdate: (chunk: Partial<SSEOutput>) => onEvent(chunk, assistantId),
      onSuccess: completed,
      onError: completed,
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

  onUnmounted(() => disconnect())

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
