import axios from '@/requests'
import {formUrlEncoded} from '@/utils'
import type {
  AuthCredentials,
  AuthenticationInfo,
  AuthenticationType,
  PrepareData,
  ResourceEntity,
  RestResult
} from '@/types'

/**
 * 认证服务类
 * 提供用户登录、登出和应用数据初始化等认证相关的 API 调用
 *
 * @author maurice.chen
 */
export class AuthService {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  /** 登录接口 URL */
  static readonly LOGIN_URL: string = AuthService.BASE_URL + '/login'
  /** 登出接口 URL */
  static readonly LOGOUT_URL: string = AuthService.BASE_URL + '/logout'
  /** 应用数据初始化接口 URL */
  static readonly PREPARE_URL: string = AuthService.BASE_URL + '/prepare'
  /** 获取用户资源的接口路径 */
  static readonly PRINCIPAL_RESOURCES_URL = AuthService.BASE_URL + '/principalResources'

  /**
   * 构造函数
   * 注意：此类主要为静态方法，通常不需要实例化
   */
  constructor() {
  }

  /**
   * 用户登录
   * 向服务端发送登录请求，验证用户凭据并获取认证信息
   *
   * @param credentials - 登录凭据，包含用户名、密码和登录方式等信息
   * @param authenticationType - 认证类型，例如 'CONSOLE'（控制台用户）或 'MEMBER'（普通会员）
   * @returns Promise 对象，成功时返回包含用户认证信息的 RestResult
   *
   * @example
   * ```typescript
   * const result = await AuthService.login(
   *   { username: 'admin', password: '123456', loginType: 'USERNAME_PASSWORD' },
   *   'CONSOLE'
   * );
   * ```
   */
  static login(
    credentials: AuthCredentials,
    authenticationType: AuthenticationType,
  ): Promise<RestResult<AuthenticationInfo>> {
    // 将凭据转换为表单编码格式并发送 POST 请求
    return axios.post(AuthService.LOGIN_URL, formUrlEncoded(credentials), {
      headers: {
        // 在请求头中指定认证类型
        [import.meta.env.VITE_APP_HEADER_AUTHENTICATION_TYPE_NAME]: authenticationType,
      },
    })
  }

  /**
   * 用户登出
   * 向服务端发送登出请求，清除用户会话
   *
   * @returns Promise 对象，成功时返回空 RestResult
   *
   * @example
   * ```typescript
   * await AuthService.logout();
   * ```
   */
  static logout(): Promise<RestResult<Record<string, unknown>>> {
    return axios.post(AuthService.LOGOUT_URL)
  }

  /**
   * 准备（初始化）应用数据
   * 获取应用初始化所需的数据，包括插件服务列表和设备标识等
   * 通常在应用启动时调用，用于初始化路由、菜单等
   *
   * @returns Promise 对象，成功时返回包含插件服务和设备标识等信息的 PrepareData
   *
   * @example
   * ```typescript
   * const data = await AuthService.prepare();
   * console.log(data.pluginServices); // ['auth-server', ...]
   * console.log(data.deviceIdentified); // 设备标识
   * ```
   */
  static prepare(): Promise<RestResult<PrepareData>> {
    return axios.get(AuthService.PREPARE_URL)
  }

  /**
   * 获取当前用户资源类型为 CONSOLE 的资源集合
   * 从服务端获取当前登录用户的资源列表，支持按类型过滤和树形结构合并
   *
   * @param resourceTypes - 资源类型数组，过滤条件，仅获取指定类型的资源（如 ['MENU', 'SECURITY']）
   * @param mergeTree - 是否将资源合并为树形结构，true 表示树形，false 表示扁平列表，默认为 true
   * @returns Promise 对象，成功时返回资源数据数组
   */
  static principalResources(
    resourceTypes?: string[],
    mergeTree: boolean = true,
  ): Promise<RestResult<ResourceEntity[]>> {
    // 将参数转换为 URLSearchParams 格式
    const params = formUrlEncoded({types: resourceTypes, mergeTree})
    return axios.get(AuthService.PRINCIPAL_RESOURCES_URL, {
      params,
    })
  }
}
