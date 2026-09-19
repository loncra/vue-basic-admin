import {message} from 'antdv-next'
import type {Router} from 'vue-router'

import dayjs from 'dayjs'
import {dayjsFormat} from './dateUtils'
import {getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import i18n from '@/i18n'
import {EXECUTE_STATUS_TYPE, YES_OR_NO_TYPE} from '@/constants'
import type {DefaultCrudEntity, PageSearchConfig, SearchableColumnType} from '@loncra/antdv-pro';

/**
 * 值转换函数类型
 * 用于在表单编码过程中对特定字段的值进行自定义转换
 *
 * @param key - 字段名称
 * @param value - 字段原始值
 * @returns 转换后的值
 */
type ValueConvertFn = (key: string, value: unknown) => unknown

/**
 * 导出视图数据接口
 * 用于跳转到导出视图时传递的数据
 */
interface ExportViewData {
  /** 成功消息 */
  message: string
}

/**
 * 跳转到导出视图
 * 显示成功消息并导航到导出视图页面
 *
 * @param data - 包含成功消息的数据对象
 * @param router - Vue Router 实例，用于页面导航
 */
export function toExportView(data: ExportViewData, router: Router): void {
  // 显示成功消息
  message.success(data.message).then(() => ({}))
  // 跳转到导出视图
  router.push({name: import.meta.env.VITE_APP_EXPORT_VIEW_NAME as string}).then(() => ({}))
}

/**
 * 要求对象非空且非 undefined
 * 如果对象为 null 或 undefined，则抛出错误；否则返回对象本身
 * 常用于类型守卫，确保后续代码可以安全使用该对象
 *
 * @template T - 对象的类型
 * @param obj - 要检查的对象
 * @returns 非空的 T 类型对象
 * @throws {Error} 当对象为 null 或 undefined 时抛出错误
 *
 * @example
 * ```typescript
 * const user = requireNonNullOrUndefined(getUser()); // 确保 user 不为 null 或 undefined
 * console.log(user.name); // 安全访问属性
 * ```
 */
export function requireNonNullOrUndefined<T>(obj: T | unknown | undefined): T {
  if (obj === null) {
    throw new Error('对象为 null')
  }

  if (obj === undefined) {
    throw new Error('对象为 undefined')
  }

  return obj as T
}

/**
 * 将 JSON 对象转换为 URLSearchParams 格式
 * 用于构建 URL 查询参数或表单编码数据
 * 支持忽略指定属性、值转换和数组处理
 *
 * @param json - 要转换的 JSON 对象
 * @param ignoreProperties - 要忽略的属性名，可以是单个字符串或字符串数组
 * @param valueConvert - 可选的值转换函数，用于对特定字段的值进行自定义转换
 * @returns URLSearchParams 对象，可直接用于 URL 或表单提交
 *
 * @example
 * ```typescript
 * const params = formUrlEncoded(
 *   { name: 'John', age: 30, ignoreMe: 'value' },
 *   ['ignoreMe'],
 *   (key, val) => key === 'age' ? val.toString() : val
 * );
 * // 结果: name=John&age=30
 * ```
 */
export function formUrlEncoded(
  json: Record<string, unknown>,
  ignoreProperties?: string | string[],
  valueConvert?: ValueConvertFn,
): URLSearchParams {
  const param = new URLSearchParams()

  // 处理忽略属性列表
  let ignore: string[] = []

  if (typeof ignoreProperties === 'string') {
    ignore.push(ignoreProperties)
  } else {
    ignore = ignoreProperties || []
  }

  // 遍历对象属性
  for (const j in json) {
    // 跳过忽略的属性
    if (ignore.includes(j)) {
      continue
    }

    let val = json[j]

    // 跳过 undefined 和 null 值
    if (val === undefined || val === null) {
      continue
    }

    // 应用值转换函数（如果提供）
    if (valueConvert) {
      val = valueConvert(j, val)
    }

    // 处理数组：数组的每个元素都作为单独的参数值
    if (Array.isArray(val)) {
      val.forEach((v) => param.append(j, convertFormUrlencoded(v) as string))
    } else {
      param.append(j, convertFormUrlencoded(val) as string)
    }
  }

  return param
}

/**
 * 转换表单 URL 编码值
 * 主要用于将 dayjs 日期对象转换为字符串格式
 * 其他类型的值直接返回原值
 *
 * @param val - 要转换的值
 * @returns 转换后的值，dayjs 对象会被转换为字符串，其他类型保持不变
 */
export function convertFormUrlencoded(
  val: unknown,
): string | number | boolean | null | undefined | unknown {
  // 如果是 dayjs 日期对象，转换为指定格式的字符串
  if (dayjs.isDayjs(val)) {
    return dayjsFormat(val, import.meta.env.VITE_APP_POST_DATETIME_FORMAT)
  }

  // 其他类型直接返回
  return val
}

/**
 * 转换配置接口
 * @template TSource - 源数据类型
 * @template TTarget - 目标数据类型
 */
export interface ConvertConfig<TSource extends Record<string, unknown>, TTarget extends Record<string, unknown>> {
  /** 字段映射：源字段名 -> 目标字段名，如 { id: 'key', name: 'label' } */
  fieldMappings: Record<string, string>

  /** 需保留到目标对象的源字段（保持原名） */
  preserveFields?: string[]

  /** 递归子节点字段名，如 'children'，有则递归转换 */
  childrenField?: string

  /** 过滤：返回 false 的项不参与转换 */
  filter?: (item: TSource) => boolean

  /** 单字段值转换：目标字段名 -> 转换函数 */
  valueTransformers?: Partial<Record<string, (value: unknown, item: TSource) => unknown>>

  /** 完全自定义：覆盖默认转换逻辑，用于复杂场景 */
  customTransform?: (item: TSource) => TTarget
}

/**
 * 递归转换单个子节点数组
 */
function convertChildren<TSource extends Record<string, unknown>, TTarget extends Record<string, unknown>>(
  source: TSource[],
  config: ConvertConfig<TSource, TTarget>,
): TTarget[] {
  return convertObject(source, config)
}

/**
 * 通用数据转换函数
 * 支持单个对象或数组，支持递归、过滤、字段映射
 *
 * @param source - 源数据，单个对象或数组
 * @param config - 转换配置
 * @returns 转换后的目标数组
 *
 * @example
 * ```typescript
 * // 场景 1：菜单（与现有 RecursionMenu 兼容）
 * const preset = {
 *   ...ANTDV_MENU_PRESET,
 *   valueTransformers: {
 *     key: (_, item) => `${item.type}_${item.id}-item`,
 *   },
 * }
 * convertObject(serverData.children, preset)
 *
 * // 场景 2：树形选择器
 * const treePreset = {
 *   fieldMappings: { id: 'value', name: 'label' },
 *   childrenField: 'children',
 *   preserveFields: ['value'],
 * }
 * convertObject(serverData, treePreset)
 * ```
 */
export function convertObject<TSource extends Record<string, unknown>, TTarget extends Record<string, unknown>>(
  source: TSource | TSource[],
  config: ConvertConfig<TSource, TTarget>,
): TTarget[] {
  const items = Array.isArray(source) ? source : [source]

  const result: TTarget[] = []

  for (const item of items) {
    // 1. filter 过滤
    if (config.filter && !config.filter(item)) {
      continue
    }

    let target: TTarget

    // 2. customTransform 优先
    if (config.customTransform) {
      target = config.customTransform(item)
    } else {
      // 3. 按 fieldMappings 映射
      target = {} as TTarget

      for (const [srcKey, targetKey] of Object.entries(config.fieldMappings)) {
        const rawValue = item[srcKey]
        if (rawValue === undefined || rawValue === null) {
          continue
        }

        let value: unknown = rawValue

        // 应用 valueTransformers
        if (config.valueTransformers && config.valueTransformers[targetKey]) {
          value = config.valueTransformers[targetKey]!(rawValue, item)
        }

        ;(target as Record<string, unknown>)[targetKey] = value
      }

      // 4. 合并 preserveFields（支持 valueTransformers）
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

    // 5. 递归处理 children
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

/** 表单 YesOrNo(0/1) → boolean（后端 toBoolean 不认数字） */
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

/** 落库 boolean / YesOrNo → 表单 YesOrNo 数值 */
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

export function applyColumnOptions<RecordType extends object = DefaultCrudEntity>(columns:SearchableColumnType<RecordType>[], dataIndex: string, enumOptions: NameValueEnumMetadata<number | string>[]) {
  const column = columns.find((item) => item.dataIndex === dataIndex || item.key === dataIndex)
  if (column?.search) {
    column.search.props = column.search.props ?? {}
    column.search.props.options = enumOptions
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** 搜索项类型：就是 pro 注册表的组件 key（`select` 这种叫法两边必须一致） */
export type SearchPropsKind = 'input' | 'number' | 'select' | 'date' | 'dateRange'

/**
 * 第二条参数能覆盖的东西 = pro 的搜索项声明（`PageSearchConfig`）去掉 `component`（component 由 kind 决定）。
 * 形状归 pro 所有，以后 pro 给搜索项加字段这里自动跟上，不用两边各维护一份。
 */
export type SearchPropsOverride = Partial<Omit<PageSearchConfig, 'component'>>

/**
 * 类型 → **整份搜索项的默认**：placeholder 文案、默认查询表达式、组件专属 props。
 * 要调默认值只动这张表（宿主的资产都在宿主这边）。
 */
const SEARCH_DEFAULTS: Record<
  SearchPropsKind,
  {placeholder: string; expression: string; props?: Record<string, unknown>}
> = {
  input: {placeholder: 'search.placeholder.input', expression: 'like'},
  number: {placeholder: 'search.placeholder.input', expression: 'eq'},
  select: {
    placeholder: 'search.placeholder.select',
    expression: 'eq',
    // 筛选下拉只有 padding、宽度靠内容撑：Select 不撑满就和下面那排按钮不等宽
    props: {classes: {root: 'w-full'}, popupMatchSelectWidth: false},
  },
  date: {placeholder: 'search.placeholder.date', expression: 'eq'},
  dateRange: {placeholder: 'search.placeholder.dateRange', expression: 'between'},
}

/**
 * 列表搜索项：整份 `search` 一次产出（`defineSearchProps('select', {expression: 'jin', props: {mode: 'multiple'}})`）。
 * 第二个参数是扩展，不传就用该类型的默认。
 *
 * `props` 返回**函数**而不是对象：`*.page.ts` 只在应用启动时求值一次，写成对象会把当时的语言冻住，
 * 之后切换语言 placeholder 不跟着变。pro 构建列时（computed 内）才调用它。
 */
export function defineSearchProps(
  kind: SearchPropsKind = 'input',
  override: SearchPropsOverride = {},
): PageSearchConfig {
  const fallback = SEARCH_DEFAULTS[kind]
  return {
    // override 里的其余字段（queryName / defaultValue / 以后 pro 新增的）原样带走
    ...override,
    component: kind,
    expression: override.expression ?? fallback.expression,
    props: () => ({
      placeholder: i18n.global.t(fallback.placeholder),
      ...fallback.props,
      ...override.props,
    }),
  }
}

export function getExecuteBadgeStatus(executeStatus:NameValueEnumMetadata<number> | number) {
  const status = getEnumValue(executeStatus)
  if (status === EXECUTE_STATUS_TYPE.PENDING) {
    return "default"
  } else if (status === EXECUTE_STATUS_TYPE.PROCESSING) {
    return "processing"
  } else if (status === EXECUTE_STATUS_TYPE.SUCCESS) {
    return "success"
  } else if (status === EXECUTE_STATUS_TYPE.FAILURE) {
    return "error"
  } else {
    return "warning"
  }
}
