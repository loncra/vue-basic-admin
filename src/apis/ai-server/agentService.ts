import type {
  AgentConversationEntity,
  AgentMessageEntity,
  AgentWorkspaceEntity,
  AgentWorkspaceResponseBody,
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

  /** 工作空间：`/agent/workspace` */
  static readonly WORKSPACE_URL = AgentService.BASE_URL + '/agent/workspace'

  static readonly MY_WORKSPACE_URL = AgentService.WORKSPACE_URL + '/my'

  /** 对话：`/agent/conversation` */
  static readonly CONVERSATION_URL = AgentService.BASE_URL + '/agent/conversation'

  /** 消息：`/agent/message` */
  static readonly MESSAGE_URL = AgentService.BASE_URL + '/agent/message'

  static readonly CHAT_URL = AgentService.BASE_URL + '/agent'

  // ---------- workspace ----------

  /** `POST /agent/workspace` */
  static my(
    request: PageRequest,
  ): Promise<RestResult<PageResult<AgentWorkspaceResponseBody>>> {
    return axios.post(AgentService.MY_WORKSPACE_URL, formUrlEncoded(request))
  }

  /** `GET /agent/workspace/{id}` */
  static getWorkspace(id: number): Promise<RestResult<AgentWorkspaceEntity>> {
    return axios.get(AgentService.WORKSPACE_URL + '/' + id)
  }

  /** `PUT /agent/workspace` */
  static saveWorkspace(entity: AgentWorkspaceEntity): Promise<RestResult<number>> {
    return axios.put(AgentService.WORKSPACE_URL, entity)
  }

  /** `DELETE /agent/workspace?ids=` */
  static deleteWorkspace(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(AgentService.WORKSPACE_URL, {params: formUrlEncoded({ids})})
  }

  // ---------- conversation ----------

  /** `POST /agent/conversation` */
  static pageConversation(
    request: PageRequest,
  ): Promise<RestResult<PageResult<AgentConversationEntity>>> {
    return axios.post(AgentService.CONVERSATION_URL, formUrlEncoded(request))
  }

  /** `DELETE /agent/conversation?ids=` */
  static deleteConversation(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(AgentService.CONVERSATION_URL, {params: formUrlEncoded({ids})})
  }

  // ---------- message ----------

  /** `POST /agent/message` */
  static pageMessage(
    request: PageRequest,
  ): Promise<RestResult<PageResult<AgentMessageEntity>>> {
    return axios.post(AgentService.MESSAGE_URL, formUrlEncoded(request))
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
