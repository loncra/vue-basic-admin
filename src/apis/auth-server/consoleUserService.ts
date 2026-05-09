import axios from '@/requests'
import {formUrlEncoded} from '@/utils'


/**
 * 认证服务类
 * 提供用户登录、登出和应用数据初始化等认证相关的 API 调用
 *
 * @author maurice.chen
 */
export class ConsoleUserService {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  /** 服务基础 URL */
  static readonly SERVICE_URL = ConsoleUserService.BASE_URL + '/console/user'

  
}
