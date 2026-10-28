import type {AuditEventEntity} from '@loncra/client/auth'
import {AuthenticationAuditEventService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'
import {postTimestampFormat} from '@/utils'
import router from '@/routers'

const authenticationAuditEventService = new AuthenticationAuditEventService()

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

  fields: {
    timestamp: {labelKey: 'authServer.lastAuthenticationTime'},
    principal: {labelKey: 'auth.account'},
  },
}
