import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {defineDetailPage} from '@/components/basic/page'
import {renderIconName, resourceCore} from './resource.page'

/** 资源详情（`Detail.vue`）。核心在 `resource.page.ts`，这里只写详情形态。 */
export const resourceDetailPage = defineDetailPage<ResourceSavePayload, ResourceEntity>(resourceCore, {
  column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
  titleText: (title, entity) => `${title} (${entity.name})`,
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
