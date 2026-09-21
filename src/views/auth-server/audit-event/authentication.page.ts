import type {AuditEventEntity} from '@loncra/client/auth'
import {AuthenticationAuditEventService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'
import {postTimestampFormat} from '@/utils'
import router from '@/routers'

const authenticationAuditEventService = new AuthenticationAuditEventService()

/**
 * 认证事件的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 * 列表形态在 `authentication.home.page.ts`。
 *
 * - 字段字典只收**实体自身的字段**：`data.details.requestDetails.*` 那些是**路径列**（不是实体字段），
 *   `labelKey` 只能留在列上（字典按实体字段名索引）。
 * - 详情要带 `after` ⇒ page 级 `onNavigate`（全局兜底只会拼 `{id}`）。
 */
export const authenticationCore: CrudPageCore<AuditEventEntity, AuditEventEntity> = {
  service: authenticationAuditEventService,
  i18nPrefix: 'authServer.authenticationEvent',
  routes: {detail: AUTH_SERVER_AUDIT_EVENT_ROUTE.AUTHENTICATION_DETAIL},
  onNavigate: ({kind, name, record}) => {
    if (kind !== 'detail' || !name || !record) {
      return
    }
    void router.push({
      name,
      query: {id: String(record.id), after: postTimestampFormat(record.timestamp)},
    })
  },

  /** 字段字典：labelKey 只写一次 */
  fields: {
    timestamp: {labelKey: 'authServer.lastAuthenticationTime'},
    principal: {labelKey: 'auth.account'},
  },
}
