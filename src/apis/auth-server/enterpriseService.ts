/**
 * @file 企业（Enterprise）REST 客户端
 * @description 对标 auth-server `EnterpriseController`：创建、我的企业、切换空间、邀请/接受、成员管理。
 */
import type {
  EnterpriseEntity,
  EnterpriseMemberEntity,
  EnterprisePayload,
  PersonalEnterprise,
  RestResult,
  TotalPage,
} from '@/types/apis'
import axios from '@/requests'
import {formUrlEncoded} from '@/utils'
import {PageRestfulCrudService} from "@/apis";

/**
 * 企业领域服务：`/api[/auth-server]/enterprise`
 *
 * @author maurice.chen
 */
export class EnterpriseService extends PageRestfulCrudService<
  EnterprisePayload,
  EnterpriseEntity,
  TotalPage<EnterpriseEntity>
>{
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = EnterpriseService.BASE_URL + '/enterprise'

  static readonly MY_URL = EnterpriseService.SERVICE_URL + '/my'

  static readonly SWITCH_URL = EnterpriseService.SERVICE_URL + '/switch'

  static readonly MEMBERS_LEAVE_URL = EnterpriseService.SERVICE_URL + '/members/leave'

  constructor() {
    super(EnterpriseService.SERVICE_URL)
  }

  /** `GET /enterprise/my` */
  my(): Promise<RestResult<PersonalEnterprise[]>> {
    return axios.get(EnterpriseService.MY_URL)
  }

  /** `POST /enterprise/switch`；`enterpriseId` 为空表示切回个人空间 */
  switch(enterpriseId?: number | null): Promise<RestResult<number | undefined>> {
    if (enterpriseId) {
      return axios.put(EnterpriseService.SWITCH_URL,formUrlEncoded({enterpriseId}))
    } else {
      return axios.put(EnterpriseService.SWITCH_URL)
    }
  }

  /** `POST /enterprise/invitations/{organizationId}` */
  invite(organizationId: number, phoneNumber: string): Promise<RestResult<string>> {
    return axios.post(
      EnterpriseService.SERVICE_URL + '/invitations/' + organizationId,
      formUrlEncoded({phoneNumber}),
    )
  }

  /** `POST /enterprise/invitations/accept/{code}` */
  acceptInvitation(code: string): Promise<RestResult<void>> {
    return axios.post(EnterpriseService.SERVICE_URL + '/invitations/accept/' + code)
  }

  /** `GET /enterprise/members/{organizationId}` */
  members(organizationId: number): Promise<RestResult<EnterpriseMemberEntity[]>> {
    return axios.get(EnterpriseService.SERVICE_URL + '/members/' + organizationId)
  }

  /** `DELETE /enterprise/members/{organizationId}` */
  removeMember(organizationId: number, principal: string): Promise<RestResult<void>> {
    return axios.delete(EnterpriseService.SERVICE_URL + '/members/' + organizationId, {
      params: formUrlEncoded({principal}),
    })
  }

  /** `DELETE /enterprise/members/leave/{organizationId}` */
  leave(enterpriseId: number): Promise<RestResult<void>> {
    return axios.delete(EnterpriseService.MEMBERS_LEAVE_URL + '/' + enterpriseId)
  }

}
