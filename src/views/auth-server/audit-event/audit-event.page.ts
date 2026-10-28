import type {AuditEventEntity} from '@loncra/client/auth'
import {AuditEventService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'

export const auditEventService = new AuditEventService()

export const auditEventCore: CrudPageCore<AuditEventEntity, AuditEventEntity> = {
  service: auditEventService as unknown as CrudPageCore<
    AuditEventEntity,
    AuditEventEntity
  >['service'],
  i18nPrefix: 'operation',
  routes: {
    detail: AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE_DETAIL,
  },

  fields: {
    id: {labelKey: 'common.id'},
    principal: {labelKey: 'Crud.operationTrace.principal'},
    timestamp: {labelKey: 'Crud.operationTrace.time', format: 'dateTime'},
    type: {labelKey: 'Crud.operationTrace.type'},
  },
}
