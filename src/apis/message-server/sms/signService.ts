import type {
  FilterRequest,
  RestResult,
  SmsSignEntity,
  SmsTemplateEntity,
  TotalPage
} from "@/types/apis";
import {PageSearchRestfulService} from "@/apis";
import axios from "axios";
import {formUrlEncoded} from "@/utils";

/**
 * 短信签名领域服务：`/api[/message-server]/sms/sign`
 *
 * @author maurice.chen
 */
export class SmsSignService extends PageSearchRestfulService<SmsSignEntity, TotalPage<SmsSignEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = SmsSignService.BASE_URL + '/sms/sign'

  static readonly FIND_URL = '/find'

  constructor(channel:string) {
    super(SmsSignService.SERVICE_URL + "/" + channel)
  }

  find(filter:FilterRequest = {}): Promise<RestResult<SmsTemplateEntity[]>> {
    return axios.post(this.baseUrl + SmsSignService.FIND_URL, formUrlEncoded(filter))
  }
}
