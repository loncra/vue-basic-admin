import {renderIconFont} from '@loncra/antdv'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_RESOURCE_CATEGORY} from '@loncra/client/auth'
import {defineHomePage} from '@/components/basic/page'
import {
  AUTH_SERVER_RESOURCE_AUTHORITY,
  AUTH_SERVER_RESOURCE_ROUTE,
  SYSTEM_ENUM_TYPE
} from '@/constants'
import {getEnumValue} from '@/utils'
import type {DragPreviewContent} from '@loncra/antdv-pro'
import {renderIconName, RESOURCE_VARIANT, resourceCore} from './resource.page'

/** 资源列表（`Home.vue`）。核心在 `resource.page.ts`，这里只写列表形态。 */
export const resourceHomePage = defineHomePage<ResourceSavePayload, ResourceEntity>(resourceCore, {
  authority: {
    add: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
    edit: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
    detail: AUTH_SERVER_RESOURCE_AUTHORITY.GET,
    delete: AUTH_SERVER_RESOURCE_AUTHORITY.DELETE,
  },
  enums: [
    SYSTEM_ENUM_TYPE.RESOURCE_TYPE_ENUM,
    SYSTEM_ENUM_TYPE.RESOURCE_CATEGORY_ENUM,
    SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM,
  ],
  rowSelection: {
    fixed: true,
    type: 'checkbox',
    getCheckboxProps: (record: Record<string, unknown>) => ({
      disabled:
        getEnumValue((record as unknown as ResourceEntity).category) ===
        AUTH_SERVER_RESOURCE_CATEGORY.PLUGIN,
    }),
  },
  // 树表拖拽排序；提交在页面壳里（@tree-drop）
  drag: true,
  // 拖拽时显示的文本，缺省是主键（会显示成一串 id）
  formatDragPreview: (record) => renderIconName(record.name, record) as DragPreviewContent,
  columns: [
    {key: 'name', width: 450, render: renderIconName, search: {component: 'input', expression: 'like'}},
    {key: 'authority', width: 250, search: {component: 'input', expression: 'like'}},
    // 当选择器用的时候（variant: 'picker'）不展示来源
    {
      key: 'sources',
      width: 300,
      visible: ({variant}) => variant !== RESOURCE_VARIANT.PICKER,
      search: {component: 'select', expression: 'jin', props: {mode: 'multiple'}},
    },
    {key: 'applicationName', width: 150, search: {component: 'input', expression: 'like'}},
    {key: 'page', width: 350, search: {component: 'input', expression: 'like'}},
    {
      key: 'type',
      width: 150,
      search: {component: 'select', expression: 'in', props: {mode: 'multiple'}},
    },
    {key: 'category', width: 150, search: {component: 'select', expression: 'eq'}},
  ],
  rowActions: (ctx) => [
    {
      id: 'addChild',
      permission: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
      label: () => ctx.t('common.addChild', {name: ''}),
      icon: () => renderIconFont('loncra-list-tree'),
      run: (actionCtx) => {
        if (actionCtx.record) {
          void ctx.router.push({
            name: AUTH_SERVER_RESOURCE_ROUTE.ADD_CHILD,
            query: {parentId: String(actionCtx.record.id)},
          })
        }
      },
    },
    // 选择器形态只留 addChild；整页才有编辑/删除
    ...(ctx.variant === RESOURCE_VARIANT.PICKER ? [] : [{id: 'edit'}, {id: 'delete'}]),
  ],
})
