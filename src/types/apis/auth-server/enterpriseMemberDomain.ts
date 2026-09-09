import type {NameValueEnumMetadata, VersionEntityMetadata} from '@/types/apis/common'
import type {PlatformUser, RoleAuthority, UserInitializationMetadata} from './authDomain'

/**
 * 企业成员请求体
 *
 * @author maurice.chen
 */
export interface EnterpriseMemberSavePayload extends PlatformUser, VersionEntityMetadata {
  /**
   * 企业 id，同时作为企业空间租户 id
   */
  enterpriseId: number
  /**
   * 成员认证主体
   */
  principal: string
  roleIds?:number[]
  /**
   * 成员角色
   */
  role: NameValueEnumMetadata<number> | number
}

/**
 * 企业成员
 *
 * @author maurice.chen
 */
export interface EnterpriseMemberEntity extends EnterpriseMemberSavePayload {
  /**
   * 审核状态
   */
  auditStatus: NameValueEnumMetadata<number> | number
  /**
   * 最后登录时间
   */
  lastAuthenticationTime?:number
  /**
   * 性别
   */
  gender:NameValueEnumMetadata<number> | number

  initialization:UserInitializationMetadata

  roles?:RoleAuthority[]

  remark?:string
}
