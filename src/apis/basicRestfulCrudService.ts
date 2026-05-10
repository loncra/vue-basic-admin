import axios from '@/requests'
import {formUrlEncoded} from '@/utils'
import type {BasicCrudService, BasicIdMetadata, RestResult,} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'

/**
 * 约定式 REST CRUD：列表 POST + `application/x-www-form-urlencoded`，详情/删除走 query（或可切换为路径详情）
 *
 * @template TEntity - 实体类型，须含主键字段 `id`（键名由 {@link SYSTEM_CONSTANT.ID_NAME} 约定）
 */
export class BasicRestfulCrudService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> implements BasicCrudService<TEntity, TId>
{

  constructor(
    protected readonly baseUrl: string,
  ) {
  }

  get(id: TId): Promise<RestResult<TEntity>> {
    return axios.get(this.baseUrl + "/" + id)
  }

  save(entity: TEntity): Promise<RestResult<TId>> {
    return axios.put(this.baseUrl, entity)
  }

  delete(ids: TId[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: formUrlEncoded({ids})})
  }
}
