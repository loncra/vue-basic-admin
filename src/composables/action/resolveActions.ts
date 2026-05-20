import type {
  ActionAuth,
  ActionContext,
  ActionDefinition,
  ResolvedAction,
} from '@/types/composables'

export function mergeDefinitions<TItem>(
  ...lists: Array<ActionDefinition<TItem>[] | undefined>
): ActionDefinition<TItem>[] {
  const map = new Map<string, ActionDefinition<TItem>>()
  for (const def of lists.flatMap((list) => list ?? [])) {
    const existing = map.get(def.id)
    map.set(def.id, existing ? {...existing, ...def} : def)
  }
  return [...map.values()]
}

export function overrideAction<TItem>(
  definitions: ActionDefinition<TItem>[],
  id: string,
  patch: Partial<ActionDefinition<TItem>>,
): ActionDefinition<TItem>[] {
  return definitions.map((def) => (def.id === id ? {...def, ...patch} : def))
}

export function resolveActions<TItem>(
  definitions: ActionDefinition<TItem>[],
  context: ActionContext<TItem>,
  auth: ActionAuth,
): ResolvedAction[] {
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
