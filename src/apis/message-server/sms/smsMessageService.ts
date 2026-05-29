import type {
  BatchResponse,
  SmsMessageEntity,
  SmsMessageSendPayload
} from "@/types/apis/message-server";
import {PageSearchRestfulService} from "@/apis";
import type {RestResult, TotalPage} from "@/types/apis";

import {formUrlEncoded} from "@/utils";
import axios from '@/requests'

/**
 * 短信消息领域服务：`/api[/message-server]/sms`
 *
 * @author maurice.chen
 */
export class SmsMessageService extends PageSearchRestfulService<SmsMessageEntity, TotalPage<SmsMessageEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = SmsMessageService.BASE_URL + '/sms'

  constructor() {
    super(SmsMessageService.SERVICE_URL)
  }

  /** `DELETE {baseUrl}?ids=...`（`ids` 经 {@link formUrlEncoded}） */
  delete(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: formUrlEncoded({ids})})
  }

  send(data:SmsMessageSendPayload):Promise<RestResult<number[] | BatchResponse>> {
    return axios.put(SmsMessageService.SERVICE_URL, data)
  }
}
