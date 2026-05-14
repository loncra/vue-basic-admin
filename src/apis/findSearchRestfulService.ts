import type {BasicIdMetadata, FindSearchService, PageRequest, RestResult,} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import {DetailSearchRestfulService} from "@/apis/detailSearchRestfulService.ts";


export class FindSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<
  TEntity
> implements FindSearchService<
  TEntity,
  TId
> {
  static readonly FIND_URL = '/find'

  find(request: PageRequest): Promise<RestResult<TEntity[]>> {
    return axios.post(this.baseUrl + FindSearchRestfulService.FIND_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
