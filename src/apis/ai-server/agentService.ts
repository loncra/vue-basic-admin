import {AgentService as AgentClient} from '@loncra/client/ai'
import {type AbstractXRequestClass, type SSEOutput, XRequest} from '@antdv-next/x-sdk'
import type {XRequestCallbacks} from '@antdv-next/x-sdk/x-request'
import {HTTP} from '@/constants'
import {buildAuthHeaders} from '@/requests'

/**
 * SSE 消费依赖 XRequest / 浏览器头，留在管理端。
 */
export class AgentService extends AgentClient {
  static loadStream(
    assistantMessageId: number,
    callbacks: XRequestCallbacks<SSEOutput>,
    loadHistory: boolean = true,
  ): AbstractXRequestClass<Record<string, never>, SSEOutput> {
    const url = `${AgentService.STREAM_URL}/${assistantMessageId}?loadHistory=${loadHistory}`
    const request = XRequest<Record<string, never>, SSEOutput>(url, {
      manual: true,
      headers: {
        ...buildAuthHeaders(),
        [HTTP.HEADER.ACCEPT]: HTTP.CONTENT_TYPE.EVENT_STREAM,
        [HTTP.HEADER.CACHE_CONTROL]: HTTP.CACHE_CONTROL.NO_CACHE,
      },
      callbacks: callbacks,
    })
    request.run()
    return request
  }
}
