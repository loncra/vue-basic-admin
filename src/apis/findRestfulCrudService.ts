/**
 * @file 条件列表 + 完整 CRUD
 * @description 在 {@link BasicRestfulCrudService} 上增加 `find`，实现 {@link FindCurdService}。
 * `POST {baseUrl}/find`，请求体为 `application/x-www-form-urlencoded` 编码的过滤条件。
 */
import type {BasicIdMetadata, FilterRequest, FindCurdService, RestResult,} from '@/types/apis'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {BasicRestfulCrudService} from "@/apis/basicRestfulCrudService.ts";
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'

/**
 * 实现 {@link FindCurdService}：详情 + 条件列表 + 保存 + 删除。
 *
 * @typeParam TBody - 保存请求体
 * @typeParam TEntity - 实体类型
 * @typeParam TId - 主键类型
 */
export class FindRestfulCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends BasicRestfulCrudService<
  TBody,
  TEntity,
  TId
> implements FindCurdService<TBody, TEntity, TId>
{

  static readonly FIND_URL = '/find'

  /** `POST {baseUrl}/find` */
  find(request: FilterRequest): Promise<RestResult<TEntity[]>> {
    return axios.post(this.baseUrl + FindRestfulCrudService.FIND_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
