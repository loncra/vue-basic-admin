import {onUnmounted, type Ref} from 'vue'
import type {SSEOutput} from '@antdv-next/x-sdk'
import {AgentService} from '@/apis'
import {
  AGENT_CHAT_STATUS,
  AGENT_CONTENT_TYPE,
  CHAT_BUBBLE_TYPE,
  STREAM_UPDATE_TYPE,
  TEXT_TYPES,
  TOKEN_USAGE_TYPE,
  UPDATE_CONVERSATION_TYPES,
} from '@/constants'
import type {
  ActiveAgentConversationItem,
  AgentConversationItem,
  AgentSseMessageContent,
  AgentStatusChangeSse,
  AgentStreamApi,
  AgentTextMessageContent,
  AgentTokenUsageContentMetadata,
  CustomizeContentMetadata,
  GenerateConversationName,
} from '@/types/composables'
import type {
  AgentMessageEntity,
  NameValueEnumMetadata,
  StreamAgentMessageEntity
} from '@/types/apis'
import {findFirstTreeNode, getEnumValue} from '@/utils'
import useApp from "antdv-next/dist/app/useApp";


/**
 * 订阅助手 SSE
 */
export function useAgentStream(
  conversationActive: Ref<ActiveAgentConversationItem | undefined>,
  conversations: Ref<AgentConversationItem[]>
): AgentStreamApi {

  const {message} = useApp()

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

    stream.stream?.abort()
    stream.stream = undefined
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
    if (!bubble.content) {
      bubble.content = []
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
    } else if (UPDATE_CONVERSATION_TYPES.includes(sseData.type)) {
      updateConversation(sseData)
    } else if (TOKEN_USAGE_TYPE === sseData.type) {
      updateTokenUsage(sseData as AgentTokenUsageContentMetadata)
    } else if (STREAM_UPDATE_TYPE.includes(sseData.type)) {
      updateMessageStatus(sseData as CustomizeContentMetadata)
    }
  }

  function updateMessageStatus(sse:CustomizeContentMetadata) {
    const item = conversationActive.value?.dataSource.elements.find(s => s.key === String(sse.id))
    if (!item || !item.data) {
      return
    }
    const message = item.data as AgentMessageEntity
    if (sse?.metadata?.status) {
      message.status = sse.metadata.status as NameValueEnumMetadata<number>
    }
  }

  function updateTokenUsage(sse: AgentTokenUsageContentMetadata) {
    const item = conversationActive.value?.dataSource.elements.find(s => s.key === String(sse.id))
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
    const tokenUsage = message.metadata.tokenUsage as AgentTokenUsageContentMetadata[]
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
    } else if (sse.type === AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME) {
      const name = getEnumValue((sse as GenerateConversationName).metadata.name)
      active.name = name
      if (item) {
        item.name = name
      }
    }
  }

  function appendTextMessageContent(chunk: AgentTextMessageContent, content: AgentSseMessageContent[]){
    const find = content.find(s => s.id === chunk.id)
    if (!find) {
      return
    }
    const text = find as AgentTextMessageContent
    text.value += (chunk as AgentTextMessageContent).value || ""
    text.status = chunk.status
    if (chunk.endTime) {
      text.endTime = chunk.endTime
    }
  }

  function onError(error:Error) {
    console.error(error)
    message.error(error.message)
  }

  function connect(assistantId: number): void {
    const streamEntity = getStreamAgentMessageEntity(assistantId)
    if (!streamEntity || streamEntity.stream) {
      return
    }
    streamEntity.stream = AgentService.loadStream(assistantId, {
      onUpdate: (chunk: Partial<SSEOutput>) => onEvent(chunk, assistantId),
      onSuccess: () => disconnect(assistantId),
      onError: onError,
    })
  }

  function reconnectIfRunning(): void {
    const active = conversationActive.value
    if (!active) {
      return
    }
    const runs = active.dataSource
      .elements
      .filter(s => s.role === CHAT_BUBBLE_TYPE.AI)
      .filter(s => getEnumValue((s.data as AgentMessageEntity).status) === AGENT_CHAT_STATUS.RUNNING)
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
    const runs = active.dataSource
      .elements
      .filter(s => s.role === CHAT_BUBBLE_TYPE.AI)
      .filter(s => getEnumValue((s.data as AgentMessageEntity).status) === AGENT_CHAT_STATUS.RUNNING)
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
