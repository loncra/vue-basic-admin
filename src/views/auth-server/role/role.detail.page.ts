import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {defineDetailPage} from '@loncra/antdv-pro'
import {applySources, roleCore} from './role.page'

export const roleDetailPage = defineDetailPage<RoleSavePayload, RoleEntity>(roleCore, {
  column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
  postGetEntity: (entity, ctx) => {
    applySources(ctx, entity.sources)
    return entity
  },
  fields: ['id', 'name', 'authority', 'modifiable', 'removable', 'sources', 'enabled', 'remark'],
})
