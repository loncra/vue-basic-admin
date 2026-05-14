/**
 * @file 资源服务（resource-server）— 枚举等辅助 API
 * @description 与 auth-server 的 {@link AuthServerService} 类似，为 **实例方法 + 静态 URL**；
 * 提供跨服务的枚举桶查询（POST 批量 / GET 单枚举），不纳入 CRUD 继承树。
 */
import axios from "@/requests/http.ts";
import type {RestResult} from "@/types";
import type {
  EnumBucketsRequestBody,
  EnumBucketsResponseBody
} from "@/types/resource-server/resourceType.ts";

/**
 * resource-server 侧通用查询（当前仅封装枚举相关接口）。
 *
 * @author maurice.chen
 */
export class ResourceServerService {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server' : '')

  /** 枚举桶批量查询 */
  static readonly GET_SERVICE_ENUMERATE_URL = ResourceServerService.BASE_URL + '/enumerate'

  /** `POST .../enumerate`：按请求体拉取多组枚举 */
  getServiceEnumerates(filter: EnumBucketsRequestBody): Promise<RestResult<EnumBucketsResponseBody>> {
    return axios.post(ResourceServerService.GET_SERVICE_ENUMERATE_URL, filter)
  }

  /** `GET .../enumerate/{service}/{enumerateName}`：单枚举 */
  getServiceEnumerate(service: string, enumerateName:string): Promise<RestResult<EnumBucketsResponseBody>> {
    return axios.get(ResourceServerService.GET_SERVICE_ENUMERATE_URL + '/' + service + '/' + enumerateName)
  }

}
