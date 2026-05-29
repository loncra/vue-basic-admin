import type {NameValueEnumMetadata, VersionEntityMetadata} from "@/types/apis/common";
import type {PlatformUser, UserInitializationMetadata,} from './authDomain'

/**
 * 后台用户请求体
 *
 * maurice.chen
 */
export interface ConsoleUserSavePayload extends PlatformUser, VersionEntityMetadata {
  /**
   * 真实姓名
   */
  realName:string,
  /**
   * 性别
   */
  gender:NameValueEnumMetadata<number> | number
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
