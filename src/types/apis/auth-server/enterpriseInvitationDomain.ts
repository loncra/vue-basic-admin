import type {NameValueEnumMetadata, VersionEntityMetadata} from '@/types/apis/common'
import type {EnterpriseEntity, EnterpriseMemberEntity, RoleAuthority} from "@/types/apis";
import type {Dayjs} from 'dayjs';

/**
 * 企业邀请请求体
 *
 * @author maurice.chen
 */
export interface EnterpriseInvitationSavePayload extends VersionEntityMetadata {
  /**
   * 过期时间
   */
  expirationTime?: number | Dayjs;
  /**
   * 企业内部角色 id
   */
  roleIds: number[],
  /**
   * 审核类型
   */
  auditType: NameValueEnumMetadata<number> | number
  /**
   * 备注
   */
  remark?:string
  /**
   * 文案内容
   */
  subTitle?:string
}

export interface EnterpriseInvitationDetail extends EnterpriseInvitationEntity{
  /**
   * 企业信息
   */
  enterprise:EnterpriseEntity

  /**
   * 被邀请人成员信息
   */
  invitee?:EnterpriseMemberEntity

}

/**
 * 企业邀请
 *
 * @author maurice.chen
 */
export interface EnterpriseInvitationEntity extends EnterpriseInvitationSavePayload {
  /**
   * 企业 id
   */
  enterpriseId: number
  /**
   * 邀请人
   */
  principal: string
  /**
   * 邀请状态
   */
  status: NameValueEnumMetadata<number> | number
  auditType: NameValueEnumMetadata<number> | number
  /**
   * 租户 id
   */
  tenantId?: string
  /**
   * 成员信息
   */
  member:EnterpriseMemberEntity

  /**
   * 角色内容
   */
  roles?:RoleAuthority[]
}
