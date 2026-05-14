import type {
  BasicIdMetadata,
  PageCurdService,
  PageRequest,
  RestResult,
  ScrollPageResult,
} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {BasicRestfulCrudService} from "@/apis/basicRestfulCrudService.ts";
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'

/**
 * 约定式 REST CRUD：列表 POST + `application/x-www-form-urlencoded`，详情/删除走 query（或可切换为路径详情）
 *
 * @template TEntity - 实体类型，须含主键字段 `id`（键名由 {@link SYSTEM_CONSTANT.ID_NAME} 约定）
 */
export class PageRestfulCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends BasicRestfulCrudService<
  TBody,
  TEntity,
  TId
> implements PageCurdService<TBody, TEntity, TPage, TId>
{
  static readonly PAGE_URL = '/page'

  page(request: PageRequest): Promise<RestResult<TPage>> {
    return axios.post(this.baseUrl + PageRestfulCrudService.PAGE_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
