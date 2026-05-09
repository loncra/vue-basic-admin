import axios from "@/requests/http.ts";
import type {RestResult} from "@/types";
import type {
  EnumBucketsRequestBody,
  EnumBucketsResponseBody
} from "@/types/resource-server/resourceType.ts";


/**
 * 资源管理公共服务
 *
 * @author maurice.chen
 */
export class ResourceServerService {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server' : '')

  static readonly GET_SERVICE_ENUMERATE_URL = ResourceServerService.BASE_URL + '/enumerate'

  getServiceEnumerates(filter: EnumBucketsRequestBody): Promise<RestResult<EnumBucketsResponseBody>> {
    return axios.post(ResourceServerService.GET_SERVICE_ENUMERATE_URL, filter)
  }

  getServiceEnumerate(service: string, enumerateName:string): Promise<RestResult<EnumBucketsResponseBody>> {
    return axios.get(ResourceServerService.GET_SERVICE_ENUMERATE_URL + '/' + service + '/' + enumerateName)
  }

}
