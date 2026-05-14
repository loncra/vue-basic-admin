import {FindSearchRestfulService} from "@/apis/findSearchRestfulService.ts";
import type {AuditEventEntity} from "@/types/auth-server/auditEntityType.ts";

/**
 * 审计事件服务
 *
 * @author maurice.chen
 */
export class AuthenticationAuditEventService extends FindSearchRestfulService<AuditEventEntity> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  /** 服务基础 URL */
  static readonly SERVICE_URL = AuthenticationAuditEventService.BASE_URL + '/audit/event/authentication'

  constructor() {
    super(AuthenticationAuditEventService.SERVICE_URL)
  }
}
