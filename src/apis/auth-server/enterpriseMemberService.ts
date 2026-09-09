/**
 * @file 企业成员 REST 客户端
 * @description 对接 `enterprise/member`。列表是 `POST {baseUrl}`，不是基类默认的 `/page`。
 */
import type {
  AuditMetadata,
  EnterpriseMemberEntity,
  EnterpriseMemberSavePayload, RestResult,
  TotalPage,
} from "@/types/apis";
import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";
import axios from "@/requests/http.ts";
import {formUrlEncoded} from "@/utils";

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

  static readonly AUDIT_URL = EnterpriseMemberService.SERVICE_URL + '/audit'

  constructor() {
    super(EnterpriseMemberService.SERVICE_URL)
  }

  audit(ids: number[], auditMetadata:AuditMetadata):Promise<RestResult<void>> {
    return axios.put(EnterpriseMemberService.AUDIT_URL, auditMetadata, {params:formUrlEncoded({ids})})
  }
}
