/**
 * @file 企业（Enterprise）REST 客户端
 * @description 对标 auth-server `EnterpriseController`：创建、我的企业、切换空间、邀请/接受、成员管理。
 */
import type {
  EnterpriseEntity,
  EnterpriseInvitationDetail,
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

  static readonly MEMBERS_LEAVE_URL = EnterpriseService.SERVICE_URL + '/member/leave'

  static readonly INVITATION_DETAIL_URL = EnterpriseService.SERVICE_URL + '/invitation/detail'

  static readonly INVITATION_CONFIRM_URL = EnterpriseService.SERVICE_URL + '/invitation/confirm'

  constructor() {
    super(EnterpriseService.SERVICE_URL)
  }

  /** `GET /enterprise/my` */
  my(): Promise<RestResult<PersonalEnterprise[]>> {
    return axios.get(EnterpriseService.MY_URL)
  }

  /** `POST /enterprise/switch`；`enterpriseId` 为空表示切回个人空间 */
  switch(enterpriseId?: number | undefined): Promise<RestResult<string | undefined>> {
    if (enterpriseId) {
      return axios.put(EnterpriseService.SWITCH_URL,formUrlEncoded({enterpriseId}))
    } else {
      return axios.put(EnterpriseService.SWITCH_URL)
    }
  }

  /** `DELETE /enterprise/members/leave/{organizationId}` */
  leave(enterpriseId: number): Promise<RestResult<void>> {
    return axios.delete(EnterpriseService.MEMBERS_LEAVE_URL + '/' + enterpriseId)
  }

  invitationDetail(id: number): Promise<RestResult<EnterpriseInvitationDetail>> {
    return axios.get(EnterpriseService.INVITATION_DETAIL_URL + '/' + id)
  }

  invitationConfirm(id:number, confirm:boolean):Promise<RestResult<EnterpriseInvitationDetail>> {
    return axios.post(EnterpriseService.INVITATION_CONFIRM_URL + '/' + id,formUrlEncoded({confirm}))
  }
}
