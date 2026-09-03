import type {NameValueEnumMetadata, VersionEntityMetadata} from '@/types/apis/common'

export interface EnterprisePayload extends VersionEntityMetadata {
  name: string
  icon?:string,
  remark?: string
}

/**
 * 企业实体
 *
 * @author maurice.chen
 */
export interface EnterpriseEntity extends EnterprisePayload {
  ownerPrincipal: string
  enabled: NameValueEnumMetadata<number> | number
}

/**
 * 个人用户视角的企业（含当前成员角色与状态）
 *
 * @author maurice.chen
 */
export interface PersonalEnterprise extends EnterpriseEntity {
  role?: NameValueEnumMetadata<number> | number
  status?: NameValueEnumMetadata<number> | number
}

/**
 * 企业成员
 *
 * @author maurice.chen
 */
export interface EnterpriseMemberEntity extends VersionEntityMetadata {
  enterpriseId: number
  principal: string
  role: NameValueEnumMetadata<number> | number
  status: NameValueEnumMetadata<number> | number
}
