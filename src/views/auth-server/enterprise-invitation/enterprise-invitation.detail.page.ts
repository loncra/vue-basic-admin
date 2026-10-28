import {defineDetailPage} from '@loncra/antdv-pro'
import {enterpriseInvitationCore, roleNamesCell,} from './enterprise-invitation.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

export const enterpriseInvitationDetailPage = defineDetailPage(enterpriseInvitationCore, {
  column: COLUMN,
  fields: [
    'id',
    'member',
    'status',
    {
      key: 'roles',
      render: roleNamesCell
    },
    'expirationTime',
    'auditType',
    'creationTime',
    'tenantId',
  ],
})
