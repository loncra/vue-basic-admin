/**
 * @file 通用 REST CRUD（详情 + 保存 + 删除）
 * @description 在 {@link DetailSearchRestfulService} 之上实现写操作，对应类型 {@link BasicCrudService}。
 * - `PUT {baseUrl}`：保存（body 为实体 JSON）
 * - `DELETE {baseUrl}`：删除（query：`ids` 经表单编码）
 * 列表能力由子类 {@link FindRestfulCrudService} / {@link PageRestfulCrudService} 追加。
 */
import axios from '@/requests'
import {formUrlEncoded} from '@/utils'
import type {BasicCrudService, BasicIdMetadata, RestResult,} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {DetailSearchRestfulService} from "@/apis/detailSearchRestfulService.ts";

/**
 * 实现 {@link BasicCrudService} 的 REST 基类：详情继承自 {@link DetailSearchRestfulService}，并增加 `save` / `delete`。
 *
 * @typeParam TBody - 保存请求体（须含主键）
 * @typeParam TEntity - 完整实体类型
 * @typeParam TId - 主键类型
 */
export class BasicRestfulCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<
  TEntity,
  TId
> implements BasicCrudService<
  TBody,
  TEntity,
  TId
> {

  /** `PUT {baseUrl}` */
  save(entity: TBody): Promise<RestResult<TId>> {
    return axios.put(this.baseUrl, entity)
  }

  /** `DELETE {baseUrl}?ids=...`（`ids` 经 {@link formUrlEncoded}） */
  delete(ids: TId[]): Promise<RestResult<void>> {
    return axios.delete(this.baseUrl, {params: formUrlEncoded({ids})})
  }

}
