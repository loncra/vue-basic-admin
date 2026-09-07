/**
 * @file 企业邀请 REST 客户端
 * @description 对接 `enterprise/invitation`。列表是 `POST {baseUrl}`，不是基类默认的 `/page`。
 */
import type {
  EnterpriseInvitationEntity,
  EnterpriseInvitationSavePayload,
  TotalPage,
} from '@/types/apis'
import {PageRestfulCrudService} from '@/apis/pageRestfulCrudService.ts'

/**
 * 企业邀请：`/api[/auth-server]/enterprise/invitation`
 *
 * @author maurice.chen
 */
export class EnterpriseInvitationService extends PageRestfulCrudService<
  EnterpriseInvitationSavePayload,
  EnterpriseInvitationEntity,
  TotalPage<EnterpriseInvitationEntity>
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = EnterpriseInvitationService.BASE_URL + '/enterprise/invitation'

  static readonly DETAIL_URL = EnterpriseInvitationService.SERVICE_URL + '/detail'

  constructor() {
    super(EnterpriseInvitationService.SERVICE_URL)
  }

}
