import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {defineDetailPage} from '@loncra/antdv-pro'
import {renderIconName, resourceCore} from './resource.page'

/**
 * 资源详情（`Detail.vue`）。核心在 `resource.page.ts`，这里只写详情形态。
 * 标题（`titleText`）没进 pro ⇒ 在 `Detail.vue` 用 `useEntityPageTitle` 拼 `(name)`。
 */
export const resourceDetailPage = defineDetailPage<ResourceSavePayload, ResourceEntity>(resourceCore, {
  column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
  fields: [
    'id',
    {key: 'name', render: renderIconName},
    'authority',
    'page',
    'sources',
    'type',
    'category',
    'enabled',
    'remark',
  ],
})
