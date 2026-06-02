import {PageSearchRestfulService} from "@/apis";
import type {BatchResponse, PageRequest, RestResult, TotalPage} from "@/types/apis";

import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import type {
  SiteMessageEntity,
  SiteMessageSendPayload
} from "@/types/apis/message-server/siteDomain.ts";

/**
 * 站内信消息领域服务：`/api[/message-server]/site`
 *
 * @author maurice.chen
 */
export class SiteMessageService extends PageSearchRestfulService<SiteMessageEntity, TotalPage<SiteMessageEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = SiteMessageService.BASE_URL + '/site'

  static readonly COUNT_READ_URL = SiteMessageService.SERVICE_URL + '/read/count'

  static readonly READ_ALL_URL = SiteMessageService.SERVICE_URL + '/read/all'

  static readonly DELETE_READ_URL = SiteMessageService.SERVICE_URL + '/read/delete'

  static readonly READ_URL = SiteMessageService.SERVICE_URL + '/read'

  static readonly MY_URL = SiteMessageService.SERVICE_URL + '/my'

  constructor() {
    super(SiteMessageService.SERVICE_URL)
  }

  delete(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: formUrlEncoded({ids})})
  }

  send(data: SiteMessageSendPayload): Promise<RestResult<number[] | BatchResponse>> {
    return axios.put(SiteMessageService.SERVICE_URL, data)
  }

  countRead(batchId: number): Promise<RestResult<void>> {
    return axios.get(SiteMessageService.COUNT_READ_URL + '/' + batchId)
  }

  readAll(...types: string[]): Promise<RestResult<void>> {
    return axios.post(SiteMessageService.READ_ALL_URL, formUrlEncoded({types}))
  }

  deleteRead(...types: string[]): Promise<RestResult<void>> {
    return axios.delete(SiteMessageService.DELETE_READ_URL, {params: formUrlEncoded({types})})
  }

  read(id: number): Promise<RestResult<SiteMessageEntity>> {
    return axios.get(SiteMessageService.READ_URL + '/' + id)
  }

  my(request: PageRequest): Promise<RestResult<TotalPage<SiteMessageEntity>>> {
    return axios.post(SiteMessageService.MY_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
