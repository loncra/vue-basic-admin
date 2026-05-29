import type {ResourceEntity, ResourceSavePayload, RestResult, TreeSortMetadata} from '@/types/apis'
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";
import axios from "@/requests/http.ts";

/**
 * 资源领域服务：`/api[/auth-server]/resource`
 *
 * @author maurice.chen
 */
export class ResourceService extends FindRestfulCrudService<ResourceSavePayload, ResourceEntity> {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  static readonly SERVICE_URL = ResourceService.BASE_URL + '/resource'
  static readonly SERVICE_SORT = ResourceService.SERVICE_URL + "/sort"

  constructor() {
    super(ResourceService.SERVICE_URL)
  }

  sort(sorts:TreeSortMetadata<number>[]):Promise<RestResult<void>> {
    return axios.put(ResourceService.SERVICE_SORT, sorts)
  }
}
