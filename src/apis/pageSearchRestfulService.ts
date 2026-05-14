/**
 * @file 只读：详情 + 分页列表（无写操作）
 * @description 从 {@link DetailSearchRestfulService} 直接分叉，实现 {@link PageSearchService}，
 * 用于仅需分页查询与详情的场景（如审计流水）。
 * `POST {baseUrl}/page`，请求体为表单编码的 {@link PageRequest}。
 */
import type {
  BasicIdMetadata,
  PageRequest,
  PageSearchService,
  RestResult,
  ScrollPageResult,
} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import {DetailSearchRestfulService} from "@/apis/detailSearchRestfulService.ts";


/**
 * 实现 {@link PageSearchService}：`get` + `page`，无写接口。
 *
 * @typeParam TEntity - 实体类型
 * @typeParam TPage - 分页结果类型
 * @typeParam TId - 主键类型
 */
export class PageSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<
  TEntity,
  TId
> implements PageSearchService<
  TEntity,
  TPage,
  TId
> {
  static readonly PAGE_URL = '/page'

  /** `POST {baseUrl}/page` */
  page(request: PageRequest): Promise<RestResult<TPage>> {
    return axios.post(this.baseUrl + PageSearchRestfulService.PAGE_URL, formUrlEncoded(request as Record<string, unknown>))
  }
}
