import {onUnmounted} from 'vue'
import type {SSEOutput} from '@antdv-next/x-sdk'
import {AgentService} from '@/apis'
import {TOKEN_USAGE_TYPE} from '@/constants'
import {
  AI_SERVER_AGENT_BLOCK_STATUS,
  AI_SERVER_AGENT_CONTENT_TYPE,
  CHAT_BUBBLE_TYPE,
  STREAM_APPEND_TYPES,
  UPDATE_CONVERSATION_TYPES
} from '@loncra/client/ai'
import type {
  AgentSseMessageContent,
  AgentStatusChangeSse,
  AgentThinkBlock,
  AgentTokenUsageContent,
  AgentToolCallBlock,
  BlockDeltaContentMetadata,
  GenerateConversationName,
} from '@/types/composables'
import type {StreamAgentMessageEntity} from '@/types/apis'
import {getEnumValue} from '@loncra/client/commons'
import {getConversationRuns} from '@/composables'
import type {AgentSession} from '@loncra/antdv-chat-pro'
import {updateSessionMessage} from '@loncra/antdv-chat-pro'

export function useAgentStream(current: () => AgentSession | undefined) {
  function getStreamAgentMessageEntity(assistantId: number): StreamAgentMessageEntity | undefined {
    const active = current()
    if (!active) {
      return
    }
    const find = active.dataSource.elements
      .filter((item) => item.role === CHAT_BUBBLE_TYPE.AI)
      .find((item) => Number(item.id) === assistantId)
    if (find && 'model' in find) {
      return find as unknown as StreamAgentMessageEntity
    }
  }

  function disconnect(assistantId: number): void {
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

  function onEvent(chunk: Partial<SSEOutput>) {
    const active = current()
    if (!active || chunk.data == null) {
      return
    }
    const sseData: AgentSseMessageContent = JSON.parse(chunk.data)
    updateSessionMessage(active.dataSource.elements, String(sseData.assistantMessageId), (bubble) => {
      if (!bubble.content) {
        bubble.content = []
      }
      const contentTypes = Object.values(AI_SERVER_AGENT_CONTENT_TYPE) as string[]
      if (!contentTypes.includes(sseData.type)) {
        return
      }
      if (STREAM_APPEND_TYPES.includes(sseData.type)) {
        const content = bubble.content as unknown as AgentSseMessageContent[]
        if (!content.some((item) => item.id === sseData.id && sseData.type === item.type)) {
          content.push(sseData)
          if (getEnumValue(sseData.type) === AI_SERVER_AGENT_CONTENT_TYPE.THINK) {
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
    })
  }

  function updateTokenUsage(sse: AgentTokenUsageContent) {
    const elements = current()?.dataSource.elements
    if (!elements) {
      return
    }
    updateSessionMessage(elements, String(sse.assistantMessageId), (item) => {
      const row = item as {metadata?: {tokenUsage?: AgentTokenUsageContent[]}}
      if (!row.metadata) {
        row.metadata = {}
      }
      if (!row.metadata.tokenUsage) {
        row.metadata.tokenUsage = []
      }
      const tokenUsage = row.metadata.tokenUsage
      const found = tokenUsage.find((item) => getEnumValue(item.usageType) === getEnumValue(sse.usageType))
      if (found) {
        found.inputTokens += sse.inputTokens
        found.outputTokens += sse.outputTokens
        found.cachedTokens += sse.cachedTokens
      } else {
        tokenUsage.push(sse)
      }
    })
  }

  function updateConversation(sse: AgentSseMessageContent) {
    const active = current()
    if (!active || String(active.id) !== sse.id) {
      return
    }
    if (sse.type === AI_SERVER_AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE) {
      const status = getEnumValue((sse as AgentStatusChangeSse).status)
      active.status = status
      if (status === undefined) {
        return
      }
      updateSessionMessage(active.dataSource.elements, String(sse.assistantMessageId), (element) => {
        if (!('status' in element)) {
          return
        }
        element.status = status
      })
    } else if (sse.type === AI_SERVER_AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME) {
      active.name = getEnumValue((sse as GenerateConversationName).metadata.name)
    }
  }

  function appendContent(chunk: BlockDeltaContentMetadata, content: AgentSseMessageContent[]) {
    const found = content.find((item) => item.id === chunk.id && item.type === chunk.type)
    if (!found) {
      return
    }
    const text = found as BlockDeltaContentMetadata
    if (!text.value) {
      text.value = ''
    }
    text.value += chunk.value || ''
    if (chunk.status) {
      text.status = chunk.status
    }
    if (chunk.endTime) {
      text.endTime = chunk.endTime
    }
    if (getEnumValue(text.status) !== AI_SERVER_AGENT_BLOCK_STATUS.RUNNING && text.type === AI_SERVER_AGENT_CONTENT_TYPE.THINK) {
      (text as AgentThinkBlock).expanded = false
    }
    if (chunk.type === AI_SERVER_AGENT_CONTENT_TYPE.TOOL) {
      const tool = found as AgentToolCallBlock
      const incoming = chunk as AgentToolCallBlock
      if (incoming.outputText) {
        tool.outputText = (tool.outputText || '') + incoming.outputText
      }
      if (incoming.userConfirmed !== undefined) {
        tool.userConfirmed = incoming.userConfirmed
      }
      tool.resultState = incoming.resultState || tool.resultState
      tool.hitlStatus = incoming.hitlStatus || tool.hitlStatus
    }
  }

  function connect(assistantId: number, loadHistory: boolean = true): void {
    const streamEntity = getStreamAgentMessageEntity(assistantId)
    if (!streamEntity || streamEntity.stream) {
      return
    }
    streamEntity.stream = AgentService.loadStream(assistantId, {
      onUpdate: (chunk: Partial<SSEOutput>) => onEvent(chunk),
      onSuccess: () => disconnect(assistantId),
      onError: (error: Error) => {
        console.error(error)
      },
    }, loadHistory)
  }

  function disconnectIfRunning(): void {
    const active = current()
    if (!active) {
      return
    }
    for (const run of getConversationRuns(active)) {
      disconnect(Number(run.id))
    }
  }

  onUnmounted(disconnectIfRunning)

  return {
    connect,
    disconnectIfRunning,
    disconnect,
  }
}
