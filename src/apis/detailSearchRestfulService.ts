/**
 * @file 只读「按主键详情」REST 实现
 * @description 实现 {@link DetailSearchService}：`GET {baseUrl}/{id}`。
 * 作为只读链路的根类；带写操作的 CRUD 与「仅列表搜索」分别在 {@link BasicRestfulCrudService}、
 * {@link FindSearchRestfulService} / {@link PageSearchRestfulService} 中扩展。
 */
import type {BasicIdMetadata, DetailSearchService, FilterRequest, RestResult,} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import axios from '@/requests'
import {formUrlEncoded} from "@/utils";

/**
 * 按主键获取单条资源的 REST 基类。
 *
 * @typeParam TEntity - 实体类型，须含主键
 * @typeParam TId - 主键类型，默认取自 `TEntity[SYSTEM_CONSTANT.ID_NAME]`
 */
export class DetailSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> implements DetailSearchService<TEntity, TId> {

  static readonly EXPORT_URL = '/export'

  constructor(
    protected readonly baseUrl: string,
  ) {
  }

  exportData(filter: FilterRequest): Promise<RestResult<void>> {
    return axios.post(this.baseUrl + DetailSearchRestfulService.EXPORT_URL, formUrlEncoded(filter as Record<string, unknown>))
  }

  /** `GET {baseUrl}/{id}` */
  get(id: TId): Promise<RestResult<TEntity>> {
    return axios.get(this.baseUrl + "/" + id)
  }
}
