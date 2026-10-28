import type {AuditEventEntity} from '@loncra/client/auth'
import {defineDetailPage} from '@loncra/antdv-pro'
import {auditEventCore, auditEventService} from './audit-event.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

export const auditEventDetailPage = defineDetailPage(auditEventCore, {
  column: COLUMN,
  createEntity: () => ({
    id: '',
    principal: '',
    timestamp: 0,
    type: '',
  }),
  fields: [
    'id',
    {
      key: 'principal',
      render: (_value, entity: AuditEventEntity) =>
        entity.data?.details?.metadata?.realName || entity.principal,
    },
    'timestamp',
    'type',
  ],
  getDetail: async (id, ctx) => {
    const result = await auditEventService.detail(String(id), String(ctx.extra.after ?? ''))
    return result.data ?? undefined
  },
})
