/**
 * @file 企业角色 REST 客户端
 * @description 继承 {@link FindRestfulCrudService}，对接 `enterprise/role` 的 find + CRUD。
 */
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";
import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from "@/types/apis";

/**
 * 企业角色：`/api[/auth-server]/enterprise/role`
 *
 * @author maurice.chen
 */
export class EnterpriseRoleService extends FindRestfulCrudService<EnterpriseRoleSavePayload, EnterpriseRoleEntity> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = EnterpriseRoleService.BASE_URL + '/enterprise/role'

  constructor() {
    super(EnterpriseRoleService.SERVICE_URL)
  }
}
