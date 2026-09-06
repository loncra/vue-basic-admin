import type {
  FilterRequest,
  ResourceEntity,
  ResourceSavePayload,
  RestResult,
  TreeSortMetadata
} from '@/types/apis'
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";
import axios from "@/requests/http.ts";
import {SYSTEM_CONSTANT} from "@/constants";
import {formUrlEncoded} from "@/utils";

/**
 * 资源领域服务：`/api[/auth-server]/resource`
 *
 * @author maurice.chen
 */
export class ResourceService extends FindRestfulCrudService<ResourceSavePayload, ResourceEntity> {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  static readonly SERVICE_URL = ResourceService.BASE_URL + '/resource'
  static readonly SERVICE_SORT = ResourceService.SERVICE_URL + "/sort"
  static readonly FIND_ENTERPRISE = ResourceService.SERVICE_URL + "/find/enterprise"

  constructor() {
    super(ResourceService.SERVICE_URL)
  }

  sort(sorts:TreeSortMetadata<ResourceEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[]):Promise<RestResult<void>> {
    return axios.put(ResourceService.SERVICE_SORT, sorts)
  }

  findEnterprise(request: FilterRequest): Promise<RestResult<ResourceEntity[]>> {
    return axios.post(ResourceService.FIND_ENTERPRISE, formUrlEncoded(request as Record<string, unknown>))
  }
}
