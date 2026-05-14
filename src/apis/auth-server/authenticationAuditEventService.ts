/**
 * @file 登录认证审计事件 — 只读查询客户端
 * @description 继承 {@link FindSearchRestfulService}（无 save/delete），仅 `get` + `find`。
 */
import type {AuditEventEntity} from "@/types/auth-server/auditEntityType.ts";
import {PageSearchRestfulService} from "@/apis/pageSearchRestfulService.ts";
import type {PageResult} from "@/types";

/**
 * 认证审计事件：`/api[/auth-server]/audit/event/authentication`
 *
 * @author maurice.chen
 */
export class AuthenticationAuditEventService extends PageSearchRestfulService<AuditEventEntity, PageResult<AuditEventEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = AuthenticationAuditEventService.BASE_URL + '/audit/event/authentication'

  constructor() {
    super(AuthenticationAuditEventService.SERVICE_URL)
  }
}
