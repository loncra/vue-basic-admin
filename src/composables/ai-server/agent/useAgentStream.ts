import {onUnmounted, type Ref} from 'vue'
import type {SSEOutput} from '@antdv-next/x-sdk'
import {AgentService} from '@/apis'
import {
  AGENT_BLOCK_STATUS,
  AGENT_CONTENT_TYPE,
  CHAT_BUBBLE_TYPE,
  STREAM_APPEND_TYPES,
  TOKEN_USAGE_TYPE,
  UPDATE_CONVERSATION_TYPES,
} from '@/constants'
import type {
  ActiveAgentConversationItem,
  AgentConversationItem,
  AgentSseMessageContent,
  AgentStatusChangeSse,
  AgentStreamApi,
  AgentThinkBlock,
  AgentTokenUsageContent,
  AgentToolCallBlock,
  BlockDeltaContentMetadata,
  GenerateConversationName,
} from '@/types/composables'
import type {AgentMessageEntity, StreamAgentMessageEntity} from '@/types/apis'
import {findFirstTreeNode, getEnumValue} from '@/utils'
import {getConversationRuns} from "@/composables";


/**
 * 订阅助手 SSE
 */
export function useAgentStream(
  conversationActive: Ref<ActiveAgentConversationItem | undefined>,
  conversations: Ref<AgentConversationItem[]>
): AgentStreamApi {

  function getStreamAgentMessageEntity(assistantId:number): StreamAgentMessageEntity | undefined {
    const active = conversationActive.value
    if (!active) {
      return
    }

    const find = active.dataSource
      .elements
      .filter(s => s.role === CHAT_BUBBLE_TYPE.AI)
      .find(s => Number(s?.data?.id) === assistantId)
    if (find) {
      return find.data as StreamAgentMessageEntity
    }
  }

  function disconnect(assistantId:number): void {
    const stream = getStreamAgentMessageEntity(assistantId)
    if (!stream) {
      return
    }
    try {
      stream.stream?.abort()
    } finally {
      stream.stream = undefined
    }
  }

  function onEvent(chunk: Partial<SSEOutput>, assistantId:number) {
    const active = conversationActive.value
    if (!active) {
      return
    }

    const sseData:AgentSseMessageContent = JSON.parse(chunk.data)
    const bubble = active.dataSource
      .elements
      .find(item => item.key === String(sseData.assistantMessageId))
    if (!bubble) {
      return
    }
    if (!bubble.content) {
      bubble.content = []
    }

    const ALL_CONTENT_TYPES = Object.values(AGENT_CONTENT_TYPE) as string[]
    if (!ALL_CONTENT_TYPES.includes(sseData.type)) {
      return
    }

    if (STREAM_APPEND_TYPES.includes(sseData.type)) {
      const content = bubble.content as AgentSseMessageContent[]
      if (!content.some(s => s.id === sseData.id && sseData.type === s.type)) {
        content.push(sseData)
        if (getEnumValue(sseData.type) === AGENT_CONTENT_TYPE.THINK) {
          (sseData as AgentThinkBlock).expanded = true
        }
      } else {
        appendContent(sseData as BlockDeltaContentMetadata, content)
      }
    } else if (UPDATE_CONVERSATION_TYPES.includes(sseData.type)) {
      updateConversation(sseData)
    } else if (TOKEN_USAGE_TYPE === sseData.type) {
      updateTokenUsage(sseData as AgentTokenUsageContent)
    }
  }

  function updateTokenUsage(sse: AgentTokenUsageContent) {
    const item = conversationActive.value
      ?.dataSource
      .elements
      .find(s => s.key === String(sse.assistantMessageId))
    if (!item || !item.data) {
      return
    }
    const message = item.data as AgentMessageEntity
    if (!message.metadata) {
      message.metadata = {}
    }
    if (!message.metadata.tokenUsage) {
      message.metadata.tokenUsage = []
    }
    const tokenUsage = message.metadata.tokenUsage as AgentTokenUsageContent[]
    const find = tokenUsage.find(s => getEnumValue(s.usageType) === getEnumValue(sse.usageType))
    if (find) {
      find.inputTokens += sse.inputTokens
      find.outputTokens += sse.outputTokens
      find.cachedTokens += sse.cachedTokens
    } else {
      tokenUsage.push(sse)
    }
  }

  function updateConversation(sse: AgentSseMessageContent) {
    const active = conversationActive.value
    if (!active || String(active.id) !== sse.id) {
      return
    }
    const item = findFirstTreeNode(s => s.id === active.id, conversations.value);
    if (sse.type === AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE) {
      const status = getEnumValue((sse as AgentStatusChangeSse).status)
      active.status = status
      if (item) {
        item.status = status
      }
      const element = active.dataSource
        .elements
        .find(s => s.key === String(sse.assistantMessageId))
      if (!element || !element.data) {
        return
      }
      const message = element.data as AgentMessageEntity
      message.status = active.status
    } else if (sse.type === AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME) {
      const name = getEnumValue((sse as GenerateConversationName).metadata.name)
      active.name = name
      if (item) {
        item.name = name
      }
    }
  }

  function appendContent(chunk: BlockDeltaContentMetadata, content: AgentSseMessageContent[]){
    const find = content.find(s => s.id === chunk.id && s.type === chunk.type)
    if (!find) {
      return
    }
    const text = find as BlockDeltaContentMetadata
    if (!text.value) {
      text.value = ""
    }

    text.value += (chunk as BlockDeltaContentMetadata).value || ""
    if (chunk.status) {
      text.status = chunk.status
    }
    if (chunk.endTime) {
      text.endTime = chunk.endTime
    }
    if (getEnumValue(text.status) !== AGENT_BLOCK_STATUS.RUNNING && text.type === AGENT_CONTENT_TYPE.THINK) {
      (text as AgentThinkBlock).expanded = false
    }
    if (chunk.type === AGENT_CONTENT_TYPE.TOOL) {
      const findToolCall = find as AgentToolCallBlock
      const chunkToolCall = chunk as AgentToolCallBlock
      if (chunkToolCall.outputText) {
        findToolCall.outputText = (findToolCall.outputText || "") + chunkToolCall.outputText
      }
      if (chunkToolCall.userConfirmed !== undefined) {
        findToolCall.userConfirmed = chunkToolCall.userConfirmed
      }
      findToolCall.resultState = chunkToolCall.resultState || findToolCall.resultState
      findToolCall.hitlStatus = chunkToolCall.hitlStatus || findToolCall.hitlStatus
    }
  }

  function onError(error:Error) {
    console.error(error)
  }

  function connect(assistantId: number, loadHistory: boolean = true): void {
    const streamEntity = getStreamAgentMessageEntity(assistantId)
    if (!streamEntity || streamEntity.stream) {
      return
    }
    streamEntity.stream = AgentService.loadStream(assistantId, {
      onUpdate: (chunk: Partial<SSEOutput>) => onEvent(chunk, assistantId),
      onSuccess: () => disconnect(assistantId),
      onError: onError,
    }, loadHistory)
  }

  function reconnectIfRunning(): void {
    const active = conversationActive.value
    if (!active) {
      return
    }
    const runs = getConversationRuns(active);
    if (runs.length <= 0) {
      return
    }

    runs.forEach(s => connect(Number(s?.data?.id)))

  }

  function disconnectIfRunning() {
    const active = conversationActive.value
    if (!active) {
      return
    }
    const runs = getConversationRuns(active)
    runs.forEach(s => disconnect(Number(s?.data?.id)))
  }

  onUnmounted(disconnectIfRunning)

  return {
    connect,
    disconnectIfRunning,
    disconnect,
    reconnectIfRunning,
  }
}

export type AgentStreamComposableApi = ReturnType<typeof useAgentStream>
