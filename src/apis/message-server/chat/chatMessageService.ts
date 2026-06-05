import type {
  ChatMessageContent,
  PageRequest,
  PageResult,
  RestResult,
  UserChatConversationResponseBody, UserChatRoomEntity,
} from "@/types/apis";

import {formUrlEncoded} from "@/utils";
import axios from '@/requests'

/**
 * 用户聊天消息领域服务：`/api[/message-server]/user/chat`
 *
 * @author maurice.chen
 */
export class ChatMessageService  {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = ChatMessageService.BASE_URL + '/user/chat'

  static readonly CREATE_CONVERSATION_URL = ChatMessageService.SERVICE_URL + '/conversation/create'

  static readonly CREATE_SEND_URL = ChatMessageService.SERVICE_URL + '/send'

  static my(request: PageRequest): Promise<RestResult<UserChatConversationResponseBody[]>> {
    return axios.post(ChatMessageService.SERVICE_URL, formUrlEncoded(request as Record<string, unknown>))
  }

  static createConversation(body: UserChatRoomEntity, principals:string[]): Promise<RestResult<UserChatConversationResponseBody>> {
    return axios.put(ChatMessageService.CREATE_CONVERSATION_URL, body, {params:formUrlEncoded({principals})})
  }

  static send(body: ChatMessageContent, roomId:string): Promise<RestResult<UserChatConversationResponseBody>> {
    return axios.put(ChatMessageService.CREATE_SEND_URL + '/' + roomId, body)
  }
}
