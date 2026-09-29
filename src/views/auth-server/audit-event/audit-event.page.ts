import type {AuditEventEntity} from '@loncra/client/auth'
import {AuditEventService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'

/** 页面 service（声明取数用；旧 `Detail.vue` 里那个 `new AuditEventService()` 收进来一处写） */
export const auditEventService = new AuditEventService()

/**
 * 审计事件（操作数据轨迹）的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 *
 * 目前只有详情形态（`audit-event.detail.page.ts`）—— 「认证事件详情」与「操作数据轨迹详情」
 * 是**同一个页面**（两条路由进来），所以 `routes` 先只留必要的那条，页面里按当前路由名分叉。
 */
export const auditEventCore: CrudPageCore<AuditEventEntity, AuditEventEntity> = {
  /**
   * ⚠️ `AuditEventService` 继承的是 `DetailSearchRestfulService`（**没有**分页/列表那套），
   * 形状与 pro 的 `CollectionService` 不同 ⇒ 这里收窄一次：详情走 `getDetail` **不会调它**，
   * 等操作数据轨迹列表迁成声明式时，再把这个 core 的 service 对齐。
   */
  service: auditEventService as unknown as CrudPageCore<
    AuditEventEntity,
    AuditEventEntity
  >['service'],
  i18nPrefix: 'operation',
  routes: {
    detail: AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE_DETAIL,
  },

  /**
   * 字段字典：labelKey / format 只写一次（`timestamp` 直接用 pro 内置的 `dateTime` formatter）。
   * ⚠️ 审计这几个词用 **pro 语言包**的 `Crud.operationTrace.*`（宿主旧 key `operation.*` 已删 ✓）——
   * 与操作日志列表、详情页同一个来源。
   */
  fields: {
    id: {labelKey: 'common.id'},
    principal: {labelKey: 'Crud.operationTrace.principal'},
    timestamp: {labelKey: 'Crud.operationTrace.time', format: 'dateTime'},
    type: {labelKey: 'Crud.operationTrace.type'},
  },
}
