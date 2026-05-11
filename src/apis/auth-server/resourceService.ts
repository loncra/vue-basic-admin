import type {ResourceEntity, ResourceSavePayload} from '@/types'
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";

/**
 * 资源服务类
 * 提供资源（菜单、权限等）相关的 API 调用
 *
 * @author maurice.chen
 */
export class ResourceService extends FindRestfulCrudService<ResourceSavePayload, ResourceEntity> {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  /** 资源服务基础 URL */
  static readonly SERVICE_URL = ResourceService.BASE_URL + '/resource'

  constructor() {
    super(ResourceService.SERVICE_URL)
  }
}
