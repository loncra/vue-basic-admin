import type {PageSearchConfig} from '@loncra/antdv-pro'
import i18n from '@/i18n'

export type SearchPropsKind = 'input' | 'number' | 'select' | 'date' | 'dateRange'

export type SearchPropsOverride = Partial<Omit<PageSearchConfig, 'component'>>

const SEARCH_DEFAULTS: Record<
  SearchPropsKind,
  {placeholder: string; expression: string; props?: Record<string, unknown>}
> = {
  input: {placeholder: 'search.placeholder.input', expression: 'like'},
  number: {placeholder: 'search.placeholder.input', expression: 'eq'},
  select: {
    placeholder: 'search.placeholder.select',
    expression: 'eq',
    props: {classes: {root: 'w-full'}, popupMatchSelectWidth: false},
  },
  date: {placeholder: 'search.placeholder.date', expression: 'eq'},
  dateRange: {placeholder: 'search.placeholder.dateRange', expression: 'between'},
}

export function defineSearchProps(
  kind: SearchPropsKind = 'input',
  override: SearchPropsOverride = {},
): PageSearchConfig {
  const fallback = SEARCH_DEFAULTS[kind]
  return {
    ...override,
    component: kind,
    expression: override.expression ?? fallback.expression,
    props: () => ({
      placeholder: i18n.global.t(fallback.placeholder),
      classes: {root: 'w-full'},
      ...fallback.props,
      ...override.props,
    }),
  }
}
