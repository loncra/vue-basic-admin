import {renderIconFont} from '@/utils/commonUtils'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_RESOURCE_AUTHORITY, AUTH_SERVER_RESOURCE_CATEGORY} from '@loncra/client/auth'
import type {DragPreviewContent, RecordActionContext} from '@loncra/antdv-pro'
import {defineHomePage} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {AUTH_SERVER_RESOURCE_ROUTE} from '@/constants'
import {getEnumValue} from '@loncra/client/commons'
import {defineSearchProps} from '@/utils'
import {renderIconName, RESOURCE_VARIANT, resourceCore} from './resource.page'

function addChild(ctx: RecordActionContext<ResourceEntity>): void {
  const record = ctx.record
  if (record) {
    void router.push({
      name: AUTH_SERVER_RESOURCE_ROUTE.ADD_CHILD,
      query: {parentId: String(record.id)},
    })
  }
}

export const resourceHomePage = defineHomePage<ResourceSavePayload, ResourceEntity>(resourceCore, {
  authority: {
    add: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
    edit: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
    detail: AUTH_SERVER_RESOURCE_AUTHORITY.GET,
    delete: AUTH_SERVER_RESOURCE_AUTHORITY.DELETE,
  },
  rowSelection: {
    fixed: true,
    type: 'checkbox',
    getCheckboxProps: (record: Record<string, unknown>) => ({
      disabled:
        getEnumValue((record as unknown as ResourceEntity).category) ===
        AUTH_SERVER_RESOURCE_CATEGORY.PLUGIN,
    }),
  },
  drag: (record) => renderIconName(record.name, record) as DragPreviewContent,
  columns: [
    {key: 'name', width: 450, render: renderIconName, search: defineSearchProps('input')},
    {key: 'authority', width: 250, search: defineSearchProps('input')},
    {
      key: 'sources',
      width: 300,
      visible: ({variant}) => variant !== RESOURCE_VARIANT.PICKER,
      search: defineSearchProps('select', {expression: 'jin', props: {mode: 'multiple'}}),
    },
    {key: 'applicationName', width: 150, search: defineSearchProps('input')},
    {key: 'page', width: 350, search: defineSearchProps('input')},
    {
      key: 'type',
      width: 150,
      search: defineSearchProps('select', {expression: 'in', props: {mode: 'multiple'}}),
    },
    {key: 'category', width: 150, search: defineSearchProps('select')},
  ],
  recordActions: (ctx) => [
    {
      id: 'addChild',
      permission: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
      label: () => i18n.global.t('common.addChild', {name: ''}),
      icon: () => renderIconFont('loncra-list-tree'),
      run: addChild,
    },
    ...(ctx.variant === RESOURCE_VARIANT.PICKER ? [] : [{id: 'edit'}, {id: 'delete'}]),
  ],
})
