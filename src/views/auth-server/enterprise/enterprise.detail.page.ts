import {defineDetailPage} from '@loncra/antdv-pro'
import {enterpriseCore} from './enterprise.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

export const enterpriseDetailPage = defineDetailPage(enterpriseCore, {
  column: COLUMN,
  fields: [
    'id',
    {key: 'name', format: {name: 'iconName', args: {size: 'large'}}},
    'ownerPrincipal',
    'enabled',
    'tenantId',
    'remark',
    'disbandTime',
    'creationTime',
  ],
})
