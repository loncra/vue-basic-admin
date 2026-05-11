import type {RoleEntity, RoleSavePayload} from "@/types/auth-server/roleType.ts";
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";

/**
 * 角色服务
 *
 * @author maurice.chen
 */
export class RoleService extends FindRestfulCrudService<RoleSavePayload, RoleEntity> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  /** 服务基础 URL */
  static readonly SERVICE_URL = RoleService.BASE_URL + '/role'

  constructor() {
    super(RoleService.SERVICE_URL)
  }
}
