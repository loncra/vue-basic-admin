import {PageSearchRestfulService} from "@/apis/pageSearchRestfulService.ts";
import type {AuditEventEntity, TotalPage} from "@/types/apis";

/**
 * 操作数据轨迹审计事件：`/api[/auth-server]/audit/event/operationDataTrace`
 *
 * @author maurice.chen
 */
export class OperationDataTraceAuditEventService extends PageSearchRestfulService<AuditEventEntity, TotalPage<AuditEventEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = OperationDataTraceAuditEventService.BASE_URL + '/audit/event/operationDataTrace'

  constructor() {
    super(OperationDataTraceAuditEventService.SERVICE_URL)
  }
}
