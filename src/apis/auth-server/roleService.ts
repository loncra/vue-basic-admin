/**
 * @file 角色（Role）REST 客户端
 * @description 继承 {@link FindRestfulCrudService}，具备详情 + 条件列表 + 增删改；
 * 网关前缀随 `RUNTIME_MODE` 在单体与微服务间切换。
 */
import type {RoleEntity, RoleSavePayload} from "@/types/apis/auth-server/roleDomain.ts";
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";

/**
 * 角色领域服务：`/api[/auth-server]/role`
 *
 * @author maurice.chen
 */
export class RoleService extends FindRestfulCrudService<RoleSavePayload, RoleEntity> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = RoleService.BASE_URL + '/role'

  constructor() {
    super(RoleService.SERVICE_URL)
  }
}
