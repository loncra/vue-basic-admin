import type {NameValueEnumMetadata, VersionEntityMetadata} from '@/types/apis/common'
import type {PlatformUser, UserInitializationMetadata} from './authDomain'

/**
 * 个人用户请求体
 *
 * @author maurice.chen
 */
export interface PersonalUserSavePayload extends PlatformUser, VersionEntityMetadata {
  /**
   * 昵称 / 真实姓名
   */
  nickname: string
  /**
   * 性别
   */
  gender: NameValueEnumMetadata<number> | number
}

/**
 * 个人用户
 *
 * @author maurice.chen
 */
export interface PersonalUserEntity extends PersonalUserSavePayload {
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
   * 个人空间租户 id
   */
  tenantId?: string
  /**
   * 上次使用的企业 id
   */
  lastActiveEnterpriseId?: number
  /**
   * 推荐码
   */
  promoCode?: string
}
