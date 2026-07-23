import type {
  AgentConversationEntity,
  AgentMessageEntity,
  FilterRequest,
  PageRequest,
  PageResult,
  RestResult,
} from '@/types/apis'
import {formUrlEncoded} from '@/utils'
import axios, {buildAuthHeaders} from '@/requests'
import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentStreamPayload
} from '@/types/composables'
import {type AbstractXRequestClass, type SSEOutput, XRequest} from '@antdv-next/x-sdk'
import {AGENT_SSE_EVENT, HTTP} from '@/constants'

export type AgentStreamHandlers = {
  onEvent: (eventName: string, payload: AgentStreamPayload) => void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Agent 领域服务：`/api[/ai-server]/agent/{workspace|conversation|message}`
 *
 * @author maurice.chen
 */
export class AgentService {
  static readonly BASE_URL: string =
    '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/ai-server' : '')

  /** 对话：`/agent/conversation` */
  static readonly CONVERSATION_URL = AgentService.BASE_URL + '/agent/conversation'

  static readonly MESSAGE_URL = AgentService.BASE_URL + '/agent/message'

  static readonly CHAT_URL = AgentService.BASE_URL + '/agent'

  static readonly STREAM_URL = AgentService.CHAT_URL + '/stream'

  static readonly HISTORY_URL = AgentService.MESSAGE_URL + '/history'

  static readonly MESSAGE_POSITIONING_PAGE_NUMBER_URL =
    AgentService.MESSAGE_URL + '/positioning/page/number'

  // ---------- conversation ----------

  /** `POST /agent/conversation` */
  static findConversation(
    request: FilterRequest = {},
  ): Promise<RestResult<AgentConversationEntity[]>> {
    return axios.post(AgentService.CONVERSATION_URL, formUrlEncoded(request))
  }

  /** `DELETE /agent/conversation?ids=` */
  static deleteConversation(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(AgentService.CONVERSATION_URL, {params: formUrlEncoded({ids})})
  }

  /** `PUT /agent/conversation` */
  static saveConversation(entity: AgentConversationEntity): Promise<RestResult<number>> {
    return axios.put(AgentService.CONVERSATION_URL, entity)
  }

  // ---------- message ----------

  /** `POST /agent/message` */
  static histories(
    request: PageRequest,
    conversationId: number,
  ): Promise<RestResult<PageResult<AgentMessageEntity>>> {
    return axios.post(AgentService.HISTORY_URL + '/' + conversationId, formUrlEncoded(request))
  }

  /** `DELETE /agent/message?ids=` */
  static deleteMessage(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(AgentService.MESSAGE_URL, {params: formUrlEncoded({ids})})
  }

  /** `GET /agent/message/positioning/page/number/{conversationId}/{messageId}/{pageSize}` */
  static positioningMessagePageNumber(
    conversationId: number,
    messageId: number,
    size: number,
  ): Promise<RestResult<number>> {
    return axios.get(
      AgentService.MESSAGE_POSITIONING_PAGE_NUMBER_URL +
        '/' +
        conversationId +
        '/' +
        messageId +
        '/' +
        size,
    )
  }

  // ---------- chat ----------

  static chat(body: AgentChatRequestBody): Promise<RestResult<AgentChatResponseBody>> {
    return axios.post(AgentService.CHAT_URL, body)
  }

  /**
   * `GET /agent/message/{assistantId}/stream`
   * 使用 XRequest 消费 SSE（snapshot / patch / done）。
   */
  static loadStream(
    assistantId: number,
    handlers: AgentStreamHandlers,
  ): AbstractXRequestClass<Record<string, never>, SSEOutput> {
    const url = `${AgentService.STREAM_URL}/${assistantId}`
    const request = XRequest<Record<string, never>, SSEOutput>(url, {
      manual: true,
      headers: {
        ...buildAuthHeaders(),
        [HTTP.HEADER.ACCEPT]: HTTP.CONTENT_TYPE.EVENT_STREAM,
        [HTTP.HEADER.CACHE_CONTROL]: HTTP.CACHE_CONTROL.NO_CACHE,
      },
      callbacks: {
        onUpdate: (chunk) => {
          const eventName = String(chunk.event || AGENT_SSE_EVENT.PATCH)
          const payload = parseAgentStreamPayload(chunk.data, assistantId)
          if (payload) {
            handlers.onEvent(eventName, payload)
          }
        },
        onSuccess: () => {
          handlers.onSuccess?.()
        },
        onError: (error) => {
          handlers.onError?.(error)
        },
      },
    })
    request.run()
    return request
  }
}

function parseAgentStreamPayload(
  raw: unknown,
  fallbackAssistantId: number,
): AgentStreamPayload | undefined {
  let data: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) {
      return undefined
    }
    try {
      data = JSON.parse(trimmed)
    } catch {
      return undefined
    }
  }
  if (!data || typeof data !== 'object') {
    return undefined
  }
  const record = data as Record<string, unknown>
  return {
    assistantId: Number(record.assistantId ?? fallbackAssistantId),
    status: record.status === undefined || record.status === null ? undefined : Number(record.status),
    content: Array.isArray(record.content) ? (record.content as AgentStreamPayload['content']) : [],
    version: record.version === undefined || record.version === null ? undefined : Number(record.version),
  }
}
