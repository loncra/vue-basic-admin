import type {
  BasicIdMetadata,
  PageRequest,
  PageSearchService,
  RestResult,
  ScrollPageResult,
} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import {DetailSearchRestfulService} from "@/apis/detailSearchRestfulService.ts";


export class PageSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<
  TEntity
> implements PageSearchService<
  TEntity,
  TPage,
  TId
> {
  static readonly PAGE_URL = '/page'

  page(request: PageRequest): Promise<RestResult<TPage>> {
    return axios.post(this.baseUrl + PageSearchRestfulService.PAGE_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
