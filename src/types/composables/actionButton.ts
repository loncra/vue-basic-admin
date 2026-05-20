import type {ComputedRef, InjectionKey, VNode} from 'vue'
import type {FilterRequest, PageRequest} from '@/types/apis'

export type ActionScope = 'toolbar' | 'item'

export interface ActionContext<TItem = unknown> {
  scope: ActionScope
  record?: TItem
  items: TItem[]
  selectedItems: TItem[]
  query?: FilterRequest | PageRequest
  extras: Record<string, unknown>
}

export interface ActionDefinition<TItem = unknown> {
  id: string
  permission?: string | boolean
  visible?: (ctx: ActionContext<TItem>) => boolean
  enabled?: (ctx: ActionContext<TItem>) => boolean
  label?: (ctx: ActionContext<TItem>) => string
  icon?: (ctx: ActionContext<TItem>) => VNode
  run?: (ctx: ActionContext<TItem>) => void | Promise<void>
}

export interface ResolvedAction {
  id: string
  label: string
  icon?: VNode
  disabled: boolean
  loading?: boolean
  run?: () => void | Promise<void>
}

export interface ActionAuth {
  can: (permission?: string | boolean) => boolean
}

export interface ActionPayload<TItem = unknown> {
  id: string
  context: ActionContext<TItem>
}

export const ACTION_CONTEXT_KEY: InjectionKey<ComputedRef<ActionContext<unknown>>> =
  Symbol('actionContext')
