/**
 * @file 只读：详情 + 条件列表（无写操作）
 * @description 从 {@link DetailSearchRestfulService} 直接分叉，实现 {@link FindSearchService}，
 * 不与 {@link BasicRestfulCrudService} 继承链混合，避免「只读列表页」误带 `save`/`delete`。
 * `POST {baseUrl}/find`，请求体为表单编码的 {@link FilterRequest}。
 */
import type {BasicIdMetadata, FilterRequest, FindSearchService, RestResult,} from '@/types/apis'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import {DetailSearchRestfulService} from "@/apis/detailSearchRestfulService.ts";


/**
 * 实现 {@link FindSearchService}：`get` + `find`，无写接口。
 *
 * @typeParam TEntity - 实体类型
 * @typeParam TId - 主键类型
 */
export class FindSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<
  TEntity,
  TId
> implements FindSearchService<
  TEntity,
  TId
> {
  static readonly FIND_URL = '/find'

  /** `POST {baseUrl}/find` */
  find(request: FilterRequest): Promise<RestResult<TEntity[]>> {
    return axios.post(this.baseUrl + FindSearchRestfulService.FIND_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
