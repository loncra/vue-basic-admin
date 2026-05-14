/**
 * @file 分页列表 + 完整 CRUD
 * @description 在 {@link BasicRestfulCrudService} 上增加 `page`，实现 {@link PageCurdService}。
 * `POST {baseUrl}/page`，请求体为 `application/x-www-form-urlencoded` 编码的分页请求。
 */
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
 * 实现 {@link PageCurdService}：详情 + 分页列表 + 保存 + 删除。
 *
 * @typeParam TBody - 保存请求体
 * @typeParam TEntity - 实体类型
 * @typeParam TPage - 分页结果类型（须扩展 {@link ScrollPageResult}&lt;TEntity&gt;）
 * @typeParam TId - 主键类型
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

  /** `POST {baseUrl}/page` */
  page(request: PageRequest): Promise<RestResult<TPage>> {
    return axios.post(this.baseUrl + PageRestfulCrudService.PAGE_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
