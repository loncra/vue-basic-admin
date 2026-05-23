import type {ComputedRef} from 'vue'
import type {ActionContext} from '@/types/composables'

export function unwrapActionContext<TEntity>(
  ctx: ActionContext<TEntity> | ComputedRef<ActionContext<TEntity>> | undefined,
): ActionContext<TEntity> | undefined {
  if (!ctx) {
    return undefined
  }
  return 'value' in ctx ? (ctx.value as ActionContext<TEntity>) : ctx
}

export interface BuildItemActionContextOptions<TEntity> {
  record: TEntity
  toolbarContext?: ActionContext<TEntity> | ComputedRef<ActionContext<TEntity>>
  actionContextExtras?: Record<string, unknown>
}

export function buildItemActionContext<TEntity>(
  options: BuildItemActionContextOptions<TEntity>,
): ActionContext<TEntity> {
  const toolbarCtx = unwrapActionContext(options.toolbarContext)
  return {
    scope: 'item',
    record: options.record,
    items: toolbarCtx?.items ?? [],
    selectedItems: toolbarCtx?.selectedItems ?? [],
    query: toolbarCtx?.query,
    extras: toolbarCtx?.extras ?? options.actionContextExtras ?? {},
  }
}
