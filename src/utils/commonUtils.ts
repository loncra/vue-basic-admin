import {h, resolveComponent} from 'vue'
import {message} from 'antdv-next'
import type {VNode} from '@loncra/antdv'

import dayjs from 'dayjs'
import type {PageSearchConfig} from '@loncra/antdv-pro';
import {type DateLike, dayjsFormat, exportCollectionData} from '@loncra/antdv-pro'
import {getEnumValue, type NameValueEnumMetadata, YES_OR_NO_TYPE} from '@loncra/client/commons'
import i18n from '@/i18n'
import {RESOURCE_SERVER_USER_EXPORT_ROUTE} from '@/constants'
import router from '@/routers'

export async function exportCollectionToView(
  options: Parameters<typeof exportCollectionData>[0],
): Promise<void> {
  const result = await exportCollectionData(options)
  message.success(result.message)
  void router.push({name: RESOURCE_SERVER_USER_EXPORT_ROUTE})
}

export function requireNonNullOrUndefined<T>(obj: T | unknown | undefined): T {
  if (obj === null) {
    throw new Error('对象为 null')
  }

  if (obj === undefined) {
    throw new Error('对象为 undefined')
  }

  return obj as T
}

export function convertFormUrlencoded(val: unknown): unknown {
  if (dayjs.isDayjs(val)) {
    return dayjsFormat(val, import.meta.env.VITE_APP_POST_DATETIME_FORMAT)
  }

  return val
}

export function postTimestampFormat(value: DateLike): string {
  return dayjsFormat(value, import.meta.env.VITE_APP_POST_TIMESTAMP_FORMAT)
}

export interface ConvertConfig<TSource extends Record<string, unknown>, TTarget extends Record<string, unknown>> {
  fieldMappings: Record<string, string>

  preserveFields?: string[]

  childrenField?: string

  filter?: (item: TSource) => boolean

  valueTransformers?: Partial<Record<string, (value: unknown, item: TSource) => unknown>>

  customTransform?: (item: TSource) => TTarget
}

function convertChildren<TSource extends Record<string, unknown>, TTarget extends Record<string, unknown>>(
  source: TSource[],
  config: ConvertConfig<TSource, TTarget>,
): TTarget[] {
  return convertObject(source, config)
}

export function convertObject<TSource extends Record<string, unknown>, TTarget extends Record<string, unknown>>(
  source: TSource | TSource[],
  config: ConvertConfig<TSource, TTarget>,
): TTarget[] {
  const items = Array.isArray(source) ? source : [source]

  const result: TTarget[] = []

  for (const item of items) {
    if (config.filter && !config.filter(item)) {
      continue
    }

    let target: TTarget

    if (config.customTransform) {
      target = config.customTransform(item)
    } else {
      target = {} as TTarget

      for (const [srcKey, targetKey] of Object.entries(config.fieldMappings)) {
        const rawValue = item[srcKey]
        if (rawValue === undefined || rawValue === null) {
          continue
        }

        let value: unknown = rawValue

        if (config.valueTransformers && config.valueTransformers[targetKey]) {
          value = config.valueTransformers[targetKey]!(rawValue, item)
        }

        ;(target as Record<string, unknown>)[targetKey] = value
      }

      if (config.preserveFields) {
        for (const field of config.preserveFields) {
          let val = item[field]
          if (val !== undefined && val !== null) {
            if (config.valueTransformers?.[field]) {
              val = config.valueTransformers[field](val, item)
            }
            ;(target as Record<string, unknown>)[field] = val
          }
        }
      }
    }

    const childrenField = config.childrenField
    if (childrenField) {
      const children = item[childrenField]
      if (Array.isArray(children) && children.length > 0) {
        ;(target as Record<string, unknown>)[childrenField] = convertChildren(
          children as TSource[],
          config,
        )
      }
    }

    result.push(target)
  }

  return result
}

export function yesOrNoToBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value
  }
  const numeric = Number(getEnumValue(value as number | NameValueEnumMetadata<number>))
  if (numeric === YES_OR_NO_TYPE.YES) {
    return true
  }
  if (numeric === YES_OR_NO_TYPE.NO) {
    return false
  }
  return undefined
}

export function booleanToYesOrNo(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value ? YES_OR_NO_TYPE.YES : YES_OR_NO_TYPE.NO
  }
  const numeric = Number(getEnumValue(value as number | NameValueEnumMetadata<number>))
  if (numeric === YES_OR_NO_TYPE.YES || numeric === YES_OR_NO_TYPE.NO) {
    return numeric
  }
  return undefined
}

export function validatePassword(newPassword:string, confirmPassword:string, i18nKey:string='auth.newPassword') {
  if (confirmPassword !== newPassword) {
    const message = i18n.global.t(
      'error.notEq',
      {
        target:i18n.global.t(i18nKey),
        source:i18n.global.t('common.confirmPassword')
      }
    )
    return Promise.reject(message);
  } else {
    return Promise.resolve();
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

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

export function renderIconFont(
  type?: string,
  classes: string = '',
  spin = false,
  rotate = 0,
): VNode | null {
  if (!type) {
    return null
  }
  const IconFont = resolveComponent('IconFont')
  if (typeof IconFont === 'string') {
    return null
  }
  return h(IconFont, {type, class: 'icon ' + (classes ?? ''), spin, rotate}) as unknown as VNode
}
