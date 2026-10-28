import {defineDetailPage} from '@loncra/antdv-pro'
import {enterpriseRoleCore} from './enterprise-role.page'

const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1}

export const enterpriseRoleDetailPage = defineDetailPage(enterpriseRoleCore, {
  column: COLUMN,
  fields: ['id', 'name', 'authority', 'modifiable', 'removable', 'enabled', {key: 'remark', span: 'filled'}],
})
