import type {NameValueEnumMetadata, VersionEntityMetadata} from '@/types/apis/common'
import type {BasicSystemUser, UserInitializationMetadata} from './authDomain'

/**
 * 企业成员请求体
 *
 * @author maurice.chen
 */
export interface EnterpriseMemberSavePayload extends BasicSystemUser, VersionEntityMetadata {
  /**
   * 企业 id，同时作为企业空间租户 id
   */
  enterpriseId: number
  /**
   * 成员认证主体
   */
  principal: string
  /**
   * 企业内部角色 id
   */
  roleIds?: number[]
  /**
   * 企业内部资源 id
   */
  resourceIds?: number[]
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
   * 最后登录时间
   */
  lastAuthenticationTime: number
  /**
   * 初始化信息
   */
  initialization: UserInitializationMetadata
  /**
   * 用户类型
   */
  type: NameValueEnumMetadata<string>
  /**
   * 成员加入状态
   */
  invitation: NameValueEnumMetadata<number> | number
  /**
   * 昵称
   */
  nickname?: string
  /**
   * 性别
   */
  gender?: NameValueEnumMetadata<number> | number
  /**
   * 手机号码
   */
  phoneNumber?: string
  /**
   * 手机号码是否认证
   */
  phoneNumberVerified?: NameValueEnumMetadata<number> | number
}
