import axios from '@/requests'
import {formUrlEncoded} from '@/utils'
import type {BasicCrudService, BasicIdMetadata, RestResult,} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {DetailSearchRestfulService} from "@/apis/detailSearchRestfulService.ts";

/**
 * 约定式 REST CRUD：列表 POST + `application/x-www-form-urlencoded`，详情/删除走 query（或可切换为路径详情）
 *
 * @template TEntity - 实体类型，须含主键字段 `id`（键名由 {@link SYSTEM_CONSTANT.ID_NAME} 约定）
 */
export class BasicRestfulCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<
  TEntity
> implements BasicCrudService<
  TBody,
  TEntity,
  TId
> {

  save(entity: TBody): Promise<RestResult<TId>> {
    return axios.put(this.baseUrl, entity)
  }

  delete(ids: TId[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: formUrlEncoded({ids})})
  }

}
