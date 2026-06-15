/**
 * @file 认证中心 — 会话与初始化静态 API
 * @description 与「实体 CRUD 类」不同：本类为 **静态方法集合**，封装登录、登出、应用 `prepare`、当前主体资源拉取等；
 * 不继承 {@link DetailSearchRestfulService} 链路。
 */
import axios from '@/requests'
import {formUrlEncoded} from '@/utils'
import type {
  AuthCredentials,
  AuthenticationInfo,
  AuthenticationType,
  IdNameValueMetadata,
  PageRequest,
  PlatformUser,
  PrepareData,
  ResourceEntity,
  RestResult,
  UserMetadata
} from '@/types/apis'
import i18n from '@/i18n'

/**
 * auth-server 认证与初始化入口（无实例状态，仅静态 URL + 请求封装）。
 *
 * @author maurice.chen
 */
export class AuthServerService {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  /** 登录 */
  static readonly LOGIN_URL: string = AuthServerService.BASE_URL + '/login'
  /** 登出 */
  static readonly LOGOUT_URL: string = AuthServerService.BASE_URL + '/logout'
  /** 应用启动前准备数据（插件、设备等） */
  static readonly PREPARE_URL: string = AuthServerService.BASE_URL + '/prepare'
  /** 当前登录用户资源（可按类型过滤、可选树合并） */
  static readonly PRINCIPAL_RESOURCES_URL = AuthServerService.BASE_URL + '/principalResources'

  static readonly UPDATE_PASSWORD_URL = AuthServerService.BASE_URL + '/user/password/update'

  static readonly SYSTEM_USERS_URL = AuthServerService.BASE_URL + '/system/users'

  static readonly SYSTEM_USERS_NOT_DESENSITIZE_NAME_URL = AuthServerService.BASE_URL + '/system/users/undesensitize/name'

  static updatePassword(oldPassword: string, newPassword: string): Promise<RestResult<void>> {
    return axios.put(AuthServerService.UPDATE_PASSWORD_URL, formUrlEncoded({
      oldPassword,
      newPassword
    }))
  }

  /**
   * 用户登录
   *
   * @param credentials - 登录凭据
   * @param authenticationType - 认证维度（如控制台用户 / 会员），经请求头传递
   */
  static login(
    credentials: AuthCredentials,
    authenticationType: AuthenticationType,
  ): Promise<RestResult<AuthenticationInfo>> {
    return axios.post(AuthServerService.LOGIN_URL, formUrlEncoded(credentials), {
      headers: {
        [import.meta.env.VITE_APP_HEADER_AUTHENTICATION_TYPE_NAME]: authenticationType,
      },
    })
  }

  /** 用户登出 */
  static logout(): Promise<RestResult<Record<string, unknown>>> {
    return axios.post(AuthServerService.LOGOUT_URL)
  }

  /** 拉取应用初始化数据 */
  static prepare(): Promise<RestResult<PrepareData>> {
    return axios.get(AuthServerService.PREPARE_URL)
  }

  static systemUsers(
    request: PageRequest,
    idNameValueMetadata: boolean = true,
    desensitizeName: boolean = true
  ): Promise<RestResult<IdNameValueMetadata<PlatformUser[]>[]>> {
    if (desensitizeName){
      return axios.post(AuthServerService.SYSTEM_USERS_URL, formUrlEncoded({
        ...request,
        idNameValueMetadata
      }))
    } else {

      return axios.post(AuthServerService.SYSTEM_USERS_NOT_DESENSITIZE_NAME_URL, formUrlEncoded({
        ...request,
        idNameValueMetadata
      }))
    }
  }

  /**
   * 获取当前用户下指定类型的资源集合
   *
   * @param resourceTypes - 资源类型过滤
   * @param mergeTree - 是否合并为树形
   */
  static principalResources(
    resourceTypes?: string[],
    mergeTree: boolean = true,
  ): Promise<RestResult<ResourceEntity[]>> {
    const params = formUrlEncoded({types: resourceTypes, mergeTree})
    return axios.get(AuthServerService.PRINCIPAL_RESOURCES_URL, {
      params,
    })
  }

  static getPrincipalNameByUserDetails(details:PlatformUser | UserMetadata, defaultValue:string = i18n.global.t('common.unname')):string {
    if (!details) {
      return ''
    }
    return String(details.realName || details.username || defaultValue)
  }

}
