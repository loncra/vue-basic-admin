/**
 * @file 企业成员 REST 客户端
 * @description 对接 `enterprise/member`。列表是 `POST {baseUrl}`，不是基类默认的 `/page`。
 */
import type {EnterpriseMemberEntity, EnterpriseMemberSavePayload, TotalPage,} from "@/types/apis";
import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";

/**
 * 企业成员：`/api[/auth-server]/enterprise/member`
 *
 * @author maurice.chen
 */
export class EnterpriseMemberService extends PageRestfulCrudService<
  EnterpriseMemberSavePayload,
  EnterpriseMemberEntity,
  TotalPage<EnterpriseMemberEntity>
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = EnterpriseMemberService.BASE_URL + '/enterprise/member'

  constructor() {
    super(EnterpriseMemberService.SERVICE_URL)
  }
}
