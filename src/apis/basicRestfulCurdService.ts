import axios from '@/requests'
import {formUrlEncoded} from '@/utils'
import type {
  BasicCrudService,
  BasicIdMetadata,
  CrudListResult,
  PageRequest,
  RestResult,
} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'

/**
 * {@link BasicRestfulCrudService} 的可选行为配置
 */
export interface BasicRestfulCrudServiceOptions {
  /**
   * 为 true 时，`fetchById` 使用 `GET ${baseUrl}/{id}`；
   * 为 false 时使用 `GET ${baseUrl}?{idQueryKey}=...`
   *
   * @default false
   */
  usePathForDetail?: boolean
  /** `fetchById` 在 query 模式下的参数名，默认 {@link SYSTEM_CONSTANT.ID_NAME} */
  idQueryKey?: string
  /** `deleteByIds` 在 query 下的数组参数名，默认 `ids` */
  idsQueryKey?: string
}

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
  protected readonly idQueryKey: string
  protected readonly idsQueryKey: string
  protected readonly usePathForDetail: boolean

  constructor(
    protected readonly baseUrl: string,
    options?: BasicRestfulCrudServiceOptions,
  ) {
    this.usePathForDetail = options?.usePathForDetail ?? false
    this.idQueryKey = options?.idQueryKey ?? SYSTEM_CONSTANT.ID_NAME
    this.idsQueryKey = options?.idsQueryKey ?? 'ids'
  }

  fetchAll(filter: PageRequest): Promise<RestResult<CrudListResult<TEntity>>> {
    return axios.post(this.baseUrl, formUrlEncoded(filter as Record<string, unknown>))
  }

  fetchById(id: TId): Promise<RestResult<TEntity>> {
    const url = this.usePathForDetail
      ? `${this.baseUrl}/${encodeURIComponent(String(id))}`
      : this.baseUrl
    return axios.get(url, this.usePathForDetail ? {} : {params: {[this.idQueryKey]: id}})
  }

  save(entity: TEntity): Promise<RestResult<TId>> {
    return axios.put(this.baseUrl, entity)
  }

  deleteByIds(ids: TId[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: {[this.idsQueryKey]: ids}})
  }
}
