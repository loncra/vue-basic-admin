import {PageSearchRestfulService} from "@/apis";
import type {RestResult, TotalPage} from "@/types/apis";

import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import type {BatchMessageEntity} from "@/types/apis/message-server/batchDomain.ts";

/**
 * 批量消息领域服务：`/api[/message-server]/batch`
 *
 * @author maurice.chen
 */
export class BatchMessageService extends PageSearchRestfulService<BatchMessageEntity, TotalPage<BatchMessageEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = BatchMessageService.BASE_URL + '/batch'

  constructor() {
    super(BatchMessageService.SERVICE_URL)
  }

  /** `DELETE {baseUrl}?ids=...`（`ids` 经 {@link formUrlEncoded}） */
  delete(ids: number[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: formUrlEncoded({ids})})
  }
}
