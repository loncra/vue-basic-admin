import type {
  BasicIdMetadata,
  NameValueEnumMetadata,
  TimeProperties,
  VersionEntityMetadata
} from '@/types/common'
import {AUTHENTICATION_TYPE, LOGIN_TYPE} from '@/constants/authConstant.ts'

/**
 * 账户认证类型
 */
export type AuthenticationType = typeof AUTHENTICATION_TYPE.CONSOLE

/**
 * 登录方式类型
 */
export type LoginType =
  | typeof LOGIN_TYPE.USERNAME_PASSWORD
  | typeof LOGIN_TYPE.PHONE_NUMBER
  | typeof LOGIN_TYPE.QR_CODE

/**
 * 登录信息
 */
export interface AuthCredentials {
  username: string
  password: string
  loginType: LoginType

  [key: string]: unknown
}

/**
 * 角色信息
 */
export interface Role {
  name: string
  authority: string
}

/**
 * 用户元数据
 */
export interface UserMetadata {
  role?: Role[]
  creationTime?: number
  email?: string
  emailVerified?: NameValueEnumMetadata<number>
  phoneNumber?: string
  phoneNumberVerified?: NameValueEnumMetadata<number>
  gender?: NameValueEnumMetadata<number>
  realName?: string
  [key: string]: unknown
}

export interface AccessToken {
  /**
   * 创建时间
   */
  creationTime: number

  /**
   * token 值
   */
  value: string

  /**
   * 超时时间
   */
  expiresTime: TimeProperties
}

/**
 * 详细信息
 */
export interface Details {
  metadata: UserMetadata
  token?: AccessToken

  [key: string]: unknown
}

/**
 * 主体信息
 */
export interface Principal extends BasicIdMetadata<string>{
  username: string
}

/**
 * 认证信息
 */
export interface AuthenticationInfo {
  details?: Details
  authenticated: boolean
  principal: Principal
  lastAuthenticationTime?: number
  type: string
  name: string
  shortName: string
  grantedAuthorities: string[]
  rememberMe: boolean
}

/**
 * 准备接口返回的数据结构
 */
export interface PrepareData extends AuthenticationInfo {
  pluginServices: string[]
  deviceIdentified: string
  runtimeMode: string
}

/**
 * 基础系统用户信息
 */
export interface BasicSystemUser extends BasicIdMetadata<number>{
  /**
   * 登录智囊胡
   */
  username: string
  /**
   * 状态:1.启用、2.禁用、3.锁定
   */
  status: NameValueEnumMetadata<number> | number

}

/**
 * 平台用户信息
 */
export interface AbstractPlatformUser extends BasicSystemUser, VersionEntityMetadata {
  /**
   * 邮箱
   */
  email?:string

  /**
   * 拥有角色
   */
  roleIds?:number[]

  /**
   * 拥有资源
   */
  resourceIds?:number[]

}

/**
 * 用户初始化元数据
 */
export interface UserInitializationMetadata {
  randomPassword: NameValueEnumMetadata<number>,
  randomUsername: NameValueEnumMetadata<number>,
}
