import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {defineDetailPage} from '@loncra/antdv-pro'
import {applySources, roleCore} from './role.page'

/**
 * 角色详情（`Detail.vue`）。核心在 `role.page.ts`，这里只写详情形态。
 * 标题（`titleText`）没进 pro ⇒ 在 `Detail.vue` 用 `useEntityPageTitle` 拼 `(name)`。
 */
export const roleDetailPage = defineDetailPage<RoleSavePayload, RoleEntity>(roleCore, {
  column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
  postGetEntity: (entity, ctx) => {
    applySources(ctx, entity.sources)
    return entity
  },
  // 只写顺序与差异：labelKey / format 在字典里
  fields: ['id', 'name', 'authority', 'modifiable', 'removable', 'sources', 'enabled', 'remark'],
})
