import type {BasicIdMetadata, FilterRequest, FindCurdService, RestResult,} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {BasicRestfulCrudService} from "@/apis/basicRestfulCrudService.ts";
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'

/**
 * 约定式 REST CRUD：列表 POST + `application/x-www-form-urlencoded`，详情/删除走 query（或可切换为路径详情）
 *
 * @template TEntity - 实体类型，须含主键字段 `id`（键名由 {@link SYSTEM_CONSTANT.ID_NAME} 约定）
 */
export class FindRestfulCrudService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends BasicRestfulCrudService<TEntity, TId> implements FindCurdService<TEntity, TId>
{

  static readonly FIND_URL = '/find'

  find(request: FilterRequest): Promise<RestResult<TEntity[]>> {
    return axios.post(this.baseUrl + FindRestfulCrudService.FIND_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
