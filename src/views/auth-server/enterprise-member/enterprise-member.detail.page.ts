import {defineDetailPage} from '@loncra/antdv-pro'
import {enterpriseMemberCore} from './enterprise-member.page'

const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}

export const enterpriseMemberDetailPage = defineDetailPage(enterpriseMemberCore, {
  column: COLUMN,
  fields: [
    'nickname',
    'username',
    'principal',
    'role',
    {key: 'auditStatus', format: 'enum'},
    'status',
    'gender',
    'phoneNumber',
    'lastAuthenticationTime',
  ],
})
