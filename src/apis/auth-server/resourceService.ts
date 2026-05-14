/**
 * @file 资源（菜单 / 权限等）REST 客户端
 * @description 继承 {@link FindRestfulCrudService}，与角色服务同属 RBAC 配置域。
 */
import type {ResourceEntity, ResourceSavePayload} from '@/types'
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";

/**
 * 资源领域服务：`/api[/auth-server]/resource`
 *
 * @author maurice.chen
 */
export class ResourceService extends FindRestfulCrudService<ResourceSavePayload, ResourceEntity> {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  static readonly SERVICE_URL = ResourceService.BASE_URL + '/resource'

  constructor() {
    super(ResourceService.SERVICE_URL)
  }
}
