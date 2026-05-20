import type {
  ResolvedTableAction,
  TableActionAuth,
  TableActionContext,
  TableActionDefinition,
} from '@/types/composables'

export function mergeDefinitions<TEntity>(
  ...lists: Array<TableActionDefinition<TEntity>[] | undefined>
): TableActionDefinition<TEntity>[] {
  const map = new Map<string, TableActionDefinition<TEntity>>()
  for (const def of lists.flatMap((list) => list ?? [])) {
    const existing = map.get(def.id)
    map.set(def.id, existing ? {...existing, ...def} : def)
  }
  return [...map.values()]
}

export function overrideAction<TEntity>(
  definitions: TableActionDefinition<TEntity>[],
  id: string,
  patch: Partial<TableActionDefinition<TEntity>>,
): TableActionDefinition<TEntity>[] {
  return definitions.map((def) => (def.id === id ? {...def, ...patch} : def))
}

export function resolveActions<TEntity>(
  definitions: TableActionDefinition<TEntity>[],
  context: TableActionContext<TEntity>,
  auth: TableActionAuth,
): ResolvedTableAction[] {
  return definitions
    .filter((def) => auth.can(def.permission))
    .filter((def) => def.visible?.(context) ?? true)
    .map((def) => {
      const disabled = !(def.enabled?.(context) ?? true)
      return {
        id: def.id,
        label: def.label?.(context) ?? '',
        icon: def.icon?.(context),
        disabled,
        run: disabled
          ? undefined
          : () => {
              return def.run?.(context)
            },
      }
    })
}
