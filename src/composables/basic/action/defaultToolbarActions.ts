import type {ActionContext, ActionDefinition} from '@/types/composables'
import type {AuthorityProps} from '@/types/composables/collection'
import {createIcon} from '@/utils'

export type ActionTranslateFn = (key: string, params?: Record<string, unknown>) => string

export interface DefaultToolbarActionsOptions<TEntity> {
  authority?: AuthorityProps
  t: ActionTranslateFn
  /** 传给 createIcon 的额外 class，如 Table 标题区用 `align` */
  iconClass?: string
  onAdd: (ctx: ActionContext<TEntity>) => void
  onExport: (ctx: ActionContext<TEntity>) => void | Promise<void>
}

export function createDefaultToolbarActions<TEntity>(
  options: DefaultToolbarActionsOptions<TEntity>,
): ActionDefinition<TEntity>[] {
  const iconClass = options.iconClass ?? ''
  return [
    {
      id: 'add',
      permission: options.authority?.add,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: () => options.t('common.add', {name: ''}),
      icon: () => createIcon('loncra-file-plus-corner', iconClass),
      run: (ctx) => options.onAdd(ctx),
    },
    {
      id: 'export',
      permission: options.authority?.export,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: (ctx) =>
        ctx.selectedItems.length > 0
          ? options.t('common.export.selected', {count: ctx.selectedItems.length})
          : options.t('common.export.all'),
      icon: () => createIcon('loncra-panel-right-close', iconClass),
      run: (ctx) => options.onExport(ctx),
    },
  ]
}
