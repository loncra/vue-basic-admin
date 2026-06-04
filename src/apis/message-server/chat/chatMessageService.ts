import type {PageRequest, PageResult, RestResult,} from "@/types/apis";

import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import type {UserChatRoomResponseBody} from "../../../types/apis/message-server/chatDomain.ts";

/**
 * 用户聊天消息领域服务：`/api[/message-server]/user/chat`
 *
 * @author maurice.chen
 */
export class ChatMessageService  {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = ChatMessageService.BASE_URL + '/user/chat'

  static readonly MY_URL = ChatMessageService.SERVICE_URL + '/my'

  static my(request: PageRequest): Promise<RestResult<PageResult<UserChatRoomResponseBody>>> {
    return axios.post(ChatMessageService.MY_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
