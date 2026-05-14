/**
 * @file 操作数据轨迹审计事件 — 只读查询客户端
 * @description 继承 {@link FindSearchRestfulService}（无 save/delete），仅 `get` + `find`。
 */
import {FindSearchRestfulService} from "@/apis/findSearchRestfulService.ts";
import type {AuditEventEntity} from "@/types/auth-server/auditEntityType.ts";
import {PageSearchRestfulService} from "@/apis/pageSearchRestfulService.ts";
import type {PageResult, TotalPage} from "@/types";

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
