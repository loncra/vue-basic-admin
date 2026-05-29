import type {FilterRequest, RestResult, SmsTemplateEntity, TotalPage} from "@/types/apis";
import {PageSearchRestfulService} from "@/apis";
import axios from "axios";
import {formUrlEncoded} from "@/utils";

/**
 * 短信模版服务：`/api[/message-server]/sms/template`
 *
 * @author maurice.chen
 */
export class SmsTemplateService extends PageSearchRestfulService<SmsTemplateEntity, TotalPage<SmsTemplateEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = SmsTemplateService.BASE_URL + '/sms/template'

  static readonly FIND_URL = '/find'

  constructor(channel:string) {
    super(SmsTemplateService.SERVICE_URL + "/" + channel);
  }

  find(filter:FilterRequest = {}): Promise<RestResult<SmsTemplateEntity[]>> {
    return axios.post(this.baseUrl + SmsTemplateService.FIND_URL, formUrlEncoded(filter))
  }

  getByCode(code:string):Promise<RestResult<Record<string, unknown>>> {
    return axios.get(this.baseUrl + "/" + code)
  }
}
