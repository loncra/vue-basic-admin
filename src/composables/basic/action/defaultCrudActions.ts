import type {BasicCrudService, BasicIdMetadata} from '@/types/apis'
import type {ActionDefinition} from '@/types/composables'
import type {AuthorityProps} from '@/types/composables/collection'
import {createIcon} from '@/utils'
import type {ActionTranslateFn} from '@/composables/basic/action/defaultToolbarActions.ts'

export const BUILTIN_ITEM_ACTION_IDS = ['edit', 'detail', 'delete'] as const

export interface DefaultBulkActionsOptions<TEntity> {
  authority?: AuthorityProps
  service: unknown
  t: ActionTranslateFn
  remove: (records: TEntity[]) => void
}

export function createDefaultBulkActions<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId,
>(
  options: DefaultBulkActionsOptions<TEntity>,
): ActionDefinition<TEntity>[] {
  return [
    {
      id: 'deleteSelected',
      permission: options.authority?.delete,
      danger: true,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      enabled: (ctx) =>
        ctx.selectedItems.length > 0 &&
        typeof (options.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
      label: (ctx) =>
        options.t('common.delete.selected', {count: ctx.selectedItems.length}),
      icon: () => createIcon('loncra-archive-x'),
      run: (ctx) => options.remove(ctx.selectedItems),
    },
  ]
}

export interface DefaultItemActionsOptions<TEntity> {
  authority?: AuthorityProps
  service: unknown
  t: ActionTranslateFn
  remove: (records: TEntity[]) => void
  onEdit: (record: TEntity) => void
  onDetail: (record: TEntity) => void
}

export function createDefaultItemActions<
TBody extends BasicIdMetadata<TId>,
TEntity extends TBody,
TId,
>(
  options: DefaultItemActionsOptions<TEntity>,
): ActionDefinition<TEntity>[] {
  return [
    {
      id: 'edit',
      permission: options.authority?.edit,
      label: () => options.t('common.edit', {name: ''}),
      icon: () => createIcon('loncra-file-pen-line'),
      run: (ctx) => {
        if (ctx.record) {
          options.onEdit(ctx.record)
        }
      },
    },
    {
      id: 'detail',
      permission: options.authority?.detail,
      label: () => options.t('common.detail', {name: ''}),
      icon: () => createIcon('loncra-file-search'),
      run: (ctx) => {
        if (ctx.record) {
          options.onDetail(ctx.record)
        }
      },
    },
    {
      id: 'delete',
      permission: options.authority?.delete,
      danger:true,
      enabled: () =>
        typeof (options.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
      label: () => options.t('common.delete.text'),
      icon: () => createIcon('loncra-archive-x'),
      run: (ctx) => {
        if (ctx.record) {
          options.remove([ctx.record])
        }
      },
    },
  ]
}
