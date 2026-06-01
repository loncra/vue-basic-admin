import {PageSearchRestfulService} from "@/apis";
import type {BatchResponse, RestResult, TotalPage} from "@/types/apis";

import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import type {
  EmailMessageEntity,
  EmailMessageSendPayload
} from "@/types/apis/message-server/emailDomain.ts";

/**
 * 邮箱消息领域服务：`/api[/message-server]/email`
 *
 * @author maurice.chen
 */
export class EmailMessageService extends PageSearchRestfulService<EmailMessageEntity, TotalPage<EmailMessageEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = EmailMessageService.BASE_URL + '/email'

  constructor() {
    super(EmailMessageService.SERVICE_URL)
  }

  /** `DELETE {baseUrl}?ids=...`（`ids` 经 {@link formUrlEncoded}） */
  delete(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: formUrlEncoded({ids})})
  }

  send(data:EmailMessageSendPayload):Promise<RestResult<number[] | BatchResponse>> {
    return axios.put(EmailMessageService.SERVICE_URL, data)
  }
}
