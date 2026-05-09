import type {ResourceEntity, RestResult} from '@/types'
import axios from '@/requests/http.ts'
import {formUrlEncoded} from "@/utils";

/**
 * 资源服务类
 * 提供资源（菜单、权限等）相关的 API 调用
 *
 * @author maurice.chen
 */
export class ResourceService {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  /** 资源服务基础 URL */
  static readonly SERVICE_URL = ResourceService.BASE_URL + '/resource'

  /**
   * 获取资源集合
   * 根据过滤条件查询资源列表
   *
   * @param filter - 条件过滤规则，键值对形式的过滤条件
   * @returns Promise 对象，成功时返回资源数据数组
   *
   * @example
   * ```typescript
   * const result = await ResourceService.find({ type: 'MENU', status: 'active' });
   * ```
   */
  static find(filter: Record<string, unknown>): Promise<RestResult<ResourceEntity[]>> {
    return axios.post(ResourceService.SERVICE_URL,  formUrlEncoded(filter))
  }

  /**
   * 根据 ID 获取单个资源
   *
   * @param id - 资源的主键 ID
   * @returns Promise 对象，成功时返回资源数据对象
   *
   * @example
   * ```typescript
   * const result = await ResourceService.get('123');
   * ```
   */
  static get(id: string): Promise<RestResult<ResourceEntity>> {
    return axios.get(ResourceService.SERVICE_URL + '/' + id)
  }

}
