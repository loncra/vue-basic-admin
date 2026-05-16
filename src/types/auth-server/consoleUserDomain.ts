import type {
  AbstractPlatformUser,
  NameValueEnumMetadata,
  UserInitializationMetadata,
  VersionEntityMetadata
} from "@/types";

/**
 * 后台用户请求体
 *
 * maurice.chen
 */
export interface ConsoleUserSavePayload extends AbstractPlatformUser, VersionEntityMetadata {
  /**
   * 真实姓名
   */
  realName:string,
  /**
   * 性别
   */
  gender:NameValueEnumMetadata<number> | number
  /**
   * 电话号码
   */
  phoneNumber:string
  /**
   * 备注
   */
  remark?: string
}

/**
 * 后台用户数据类型
 * @author maurice.chen
 */
export interface ConsoleUserEntity extends ConsoleUserSavePayload {

  /**
   * 手机号码是否认证
   */
  phoneNumberVerified:NameValueEnumMetadata<number> | number
  /**
   * 是否验证邮件
   */
  emailVerified: NameValueEnumMetadata<number> | number

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
}
