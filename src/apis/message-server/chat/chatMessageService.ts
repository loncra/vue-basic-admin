import type {PageRequest, RestResult, TotalPage} from "@/types/apis";

import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import type {SiteMessageEntity} from "@/types/apis/message-server/siteDomain.ts";

/**
 * 站内信消息领域服务：`/api[/message-server]/chat`
 *
 * @author maurice.chen
 */
export class ChatMessageService  {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = ChatMessageService.BASE_URL + '/chat'

  static readonly MY_URL = ChatMessageService.SERVICE_URL + '/my'

  static my(request: PageRequest): Promise<RestResult<TotalPage<SiteMessageEntity>>> {
    return axios.post(ChatMessageService.MY_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
