import type {
  AgentConversationEntity,
  AgentMessageEntity,
  FilterRequest,
  PageRequest,
  PageResult,
  RestResult,
} from '@/types/apis'
import {formUrlEncoded} from '@/utils'
import axios from '@/requests'
import type {AgentChatRequestBody, AgentChatResponseBody} from "@/types/composables";

/**
 * Agent 领域服务：`/api[/ai-server]/agent/{workspace|conversation|message}`
 *
 * 对齐后端：
 * - {@code AgentWorkspaceController}
 * - {@code AgentConversationController}
 * - {@code AgentMessageController}
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

  static readonly HISTORY_URL = AgentService.MESSAGE_URL + '/history'

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
    conversationId:number
  ): Promise<RestResult<PageResult<AgentMessageEntity>>> {
    return axios.post(AgentService.HISTORY_URL + '/' + conversationId, formUrlEncoded(request))
  }

  /** `DELETE /agent/message?ids=` */
  static deleteMessage(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(AgentService.MESSAGE_URL, {params: formUrlEncoded({ids})})
  }

  // ---------- message ----------

  static chat(body:AgentChatRequestBody):Promise<RestResult<AgentChatResponseBody>> {
    return axios.post(AgentService.CHAT_URL, body)
  }

  static loadStream(conversationId:number) {

  }
}
