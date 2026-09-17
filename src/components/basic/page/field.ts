import {type Component, markRaw, onMounted, ref, type VNode} from 'vue'
import {DatePicker, type DescriptionsItemType, Input, InputNumber, Select} from 'antdv-next'
import {getEnumName} from '@/utils'
import i18n from '@/i18n'
import {ResourceServerService} from '@/apis'
import type {NameValueEnumMetadata, RestResult} from '@loncra/client/commons'
import {SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {
  PageContext,
  PageDetailEntry,
  PageDetailItem,
  PageEnums,
  PageFieldComponent,
  PageFieldRenderContext,
  PageFieldsDictionary,
  PageFormField,
  PageListColumn,
  PageListEntry,
  PageValueFormat,
} from './types'

/** 宿主形态名：整页（默认）。宿主自己起名时传 `variant`，如 `'picker'` */
export const PAGE_VARIANT = 'page'

// #region 字段组件注册表

/**
 * 字段组件注册表的一项。**组件专属的约定全收在这里**
 * （默认 props、枚举选项怎么喂、只给搜索项用的外观），builder 里不写 `component === 'x'` 分支。
 */
export interface FieldComponentSpec {
  component: Component
  /** 通用默认 props */
  defaults?: Record<string, unknown>
  /** 只用于列表搜索项的额外 props */
  searchDefaults?: Record<string, unknown>
  /** 枚举桶 → 组件 props；默认 `{options, fieldNames: {label: 'name'}}` */
  mapOptions?: (options: NameValueEnumMetadata<number | string>[]) => Record<string, unknown>
}

/** 默认的枚举选项喂法：`{options, fieldNames: {label: 'name'}}`（antdv-next 的枚举元数据是 `{name, value}`） */
const ENUM_OPTIONS = (options: NameValueEnumMetadata<number | string>[]) => ({
  options,
  fieldNames: {label: 'name'},
})

const FIELD_COMPONENTS: Record<string, FieldComponentSpec> = {
  input: {component: Input},
  password: {component: Input.Password},
  textarea: {component: Input.TextArea},
  number: {component: InputNumber},
  select: {
    component: Select,
    defaults: {allowClear: true},
    // 枚举选项的 fieldNames 由 mapOptions 给，这里只放搜索项专属的外观
    searchDefaults: {classes: {root: 'w-full'}, popupMatchSelectWidth: false},
    mapOptions: ENUM_OPTIONS,
  },
  date: {component: DatePicker},
  dateRange: {component: DatePicker.RangePicker},
}

/** 扩展点：注册一个新组件（够用就用内置，不够自己加） */
export function defineFieldComponent(name: string, spec: FieldComponentSpec): void {
  FIELD_COMPONENTS[name] = spec
}

/** 注册表 key 或直接给组件；key 没注册就抛（声明写错了要当场知道，别静默略过） */
function resolveFieldSpec(name?: PageFieldComponent | Component): FieldComponentSpec | undefined {
  if (!name) {
    return undefined
  }
  if (typeof name !== 'string') {
    return {component: markRaw(name)}
  }
  const spec = FIELD_COMPONENTS[name]
  if (!spec) {
    throw new Error(`[page-kit] 未注册的字段组件 '${name}'：用 defineFieldComponent 注册，或者直接传组件`)
  }
  return spec
}

// #endregion

// #region 值格式注册表

/** formatter：返回值直接当单元格 / 详情项内容渲染（string 或 VNode） */
export type ValueFormatter = (value: unknown, ctx: {key: string; record: unknown}) => string | VNode

/**
 * 值格式注册表。声明 `format` 即断言值的形状，形状不对就抛。
 * 内置两个够用就用，不够 `defineFormatter` 加（枚举标签、金额、时间、链接…）。
 */
const FORMATTERS: Record<string, ValueFormatter> = {
  enum: (value) => getEnumName(value),
  enumList: (value, {key}) => {
    if (!Array.isArray(value)) {
      throw new Error(`[page-kit] 字段 ${key} 声明 format: 'enumList'，但值不是数组：${JSON.stringify(value)}`)
    }
    return value.map(getEnumName).join(',')
  },
}

/** 扩展点：注册一个新 formatter */
export function defineFormatter(name: string, formatter: ValueFormatter): void {
  FORMATTERS[name] = formatter
}

/**
 * 没声明 `format` 就原样返回，交给表格 / 描述组件自己渲染；
 * 声明了但没注册对应 formatter → 抛（别静默略过）。
 */
export function formatValue(
  format: PageValueFormat | undefined,
  value: unknown,
  ctx: {key: string; record: unknown},
): unknown {
  if (value === null || value === undefined) {
    return ''
  }
  if (!format) {
    return value
  }
  const formatter = FORMATTERS[format]
  if (!formatter) {
    throw new Error(`[page-kit] 字段 ${ctx.key} 声明 format: '${format}'，但没有这个 formatter（用 defineFormatter 注册）`)
  }
  return formatter(value, ctx)
}

// #endregion

/**
 * 声明里的 `enums` + 条目上的 `enumId` → 挂载时一次性加载枚举桶。
 * 只返回 `buckets`：枚举是系统字典，页面里没有让它变化的时机，不需要手动 refresh。
 */
export function usePageEnums(ids?: (string | undefined)[]) {
  const buckets = ref<PageEnums>({})
  const list = [...new Set((ids ?? []).filter((id): id is string => !!id))]

  async function load(): Promise<void> {
    if (list.length === 0) {
      return
    }
    const result: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: list.map((id) => ({id})),
    })
    buckets.value = (result.data?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}) as PageEnums
  }

  onMounted(() => {
    void load()
  })

  return {buckets}
}

export function resolveLabel(key: string, labelKey: string | undefined, prefix: string) {
  return i18n.global.t(labelKey ?? `${prefix}.${key}`)
}

const SEARCH_PLACEHOLDER: Record<string, string> = {
  select: 'search.placeholder.select',
  dateRange: 'search.placeholder.dateRange',
  date: 'search.placeholder.dateRange',
}

/** 组件名（报错用）：注册表 key / 直接传的组件 / 默认 input */
function componentName(name?: PageFieldComponent | Component): string {
  if (typeof name === 'string') {
    return name
  }
  return name ? '直接传入的组件' : 'input'
}

/** 裸 key → 完整条目 */
function toListColumn<TEntity extends object>(entry: PageListEntry<TEntity>): PageListColumn<TEntity> {
  return typeof entry === 'string' ? {key: entry} : entry
}

function toDetailItem<TEntity extends object>(entry: PageDetailEntry<TEntity>): PageDetailItem<TEntity> {
  return typeof entry === 'string' ? {key: entry} : entry
}

/**
 * 列表列声明 → 表格列。列级 `visible` 在这里按 `ctx.variant` 过滤。
 *
 * 注意：antdv-next 的 Table **没有** `column.customRender`（写了会被静默忽略），
 * 单元格内容由列表壳的 `#bodyCell` 插槽调 `renderCell()` 产出。
 */
export function buildColumns<TEntity extends object>(
  declared: PageListEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
  i18nPrefix: string,
  buckets: PageEnums,
  ctx: PageContext,
): Record<string, unknown>[] {
  const columns: Record<string, unknown>[] = []
  for (const entry of declared) {
    const item = toListColumn(entry)
    if (item.visible && !item.visible(ctx)) {
      continue
    }
    const merged: PageListColumn<TEntity> = {...fields[item.key], ...item}
    const search = merged.search
    const built: Record<string, unknown> = {
      title: resolveLabel(merged.key, merged.labelKey, i18nPrefix),
      dataIndex: merged.key,
      key: merged.key,
      width: merged.width,
      ellipsis: merged.ellipsis ?? true,
    }
    if (search) {
      const spec = resolveFieldSpec(search.component)
      const enumId = merged.enumId
      const options = enumId ? buckets[enumId] ?? [] : []
      if (enumId && !spec?.mapOptions) {
        throw new Error(
          `[page-kit] 字段 ${merged.key} 的搜索项声明了 enumId，但组件 ${componentName(search.component)} 没有 mapOptions，`
            + 'options 会被丢掉：用 defineFieldComponent 给它补 mapOptions，或者去掉 enumId',
        )
      }
      const placeholderKey =
        typeof search.component === 'string' ? SEARCH_PLACEHOLDER[search.component] : undefined
      built.search = {
        component: spec?.component,
        expression: search.expression ?? 'eq',
        props: {
          placeholder: i18n.global.t(placeholderKey ?? 'search.placeholder.input'),
          ...spec?.searchDefaults,
          ...(options.length > 0 ? spec?.mapOptions?.(options) ?? {} : {}),
          ...search.props,
        },
      }
    }
    columns.push(built)
  }
  return columns
}

/**
 * 单元格内容：条目里的 `render` 优先，其次按 `format` 格式化。
 *
 * **返回 `undefined` = 不认领这个单元格**，调用方应改用手上的 `text`
 * （表格自己算好的内容：选择列的复选框、行操作列等都是这样过来的，它们是 VNode，
 * 绝不能拿去当文本插值）。
 */
export function renderCell<TEntity extends object>(
  declared: PageListEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
  columnKey: string | number | undefined,
  record: TEntity,
): unknown {
  const entry = declared.find((item) => String(typeof item === 'string' ? item : item.key) === String(columnKey))
  if (!entry) {
    return undefined
  }
  const item = toListColumn(entry)
  // 取原始值只信 record：插槽给的 text 可能已经被表格包装过
  const value = (record as Record<string, unknown>)[item.key]
  if (item.render) {
    return item.render(value, record)
  }
  const format = item.format ?? fields[item.key]?.format
  if (format) {
    return formatValue(format, value, {key: item.key, record})
  }
  return undefined
}

/**
 * 详情项声明 → a-descriptions 的 items。
 *
 * 返回类型钉在 `DescriptionsItemType` 上：antdv-next 的内容字段叫 **`content`**
 * （不是 antd React 那套 `children`，写了不报错但值是空的 —— 见
 * `node_modules/antdv-next/dist/descriptions/Item.d.ts`）。
 */
export function buildDetailItems<TEntity extends object>(
  declared: PageDetailEntry<TEntity>[],
  fields: PageFieldsDictionary<TEntity>,
  entity: TEntity,
  i18nPrefix: string,
): DescriptionsItemType[] {
  return declared.map((entry) => {
    const item = toDetailItem(entry)
    const spec = fields[item.key]
    const value = (entity as Record<string, unknown>)[item.key]
    // render / formatValue 都返回 unknown（没声明 format 就是原始值），进描述组件前收成节点类型
    const content = (
      item.render
        ? item.render(value, entity)
        : formatValue(item.format ?? spec?.format, value, {key: item.key, record: entity})
    ) as DescriptionsItemType['content']
    return {
      key: item.key,
      label: resolveLabel(item.key, item.labelKey ?? spec?.labelKey, i18nPrefix),
      span: item.span,
      content,
    }
  })
}

/**
 * 表单字段声明 → 渲染器需要的描述（标签、组件、props 一次算好，模板保持笨）。
 * 字段级 `visible` 在这里按 `ctx`（含 `variant` 与实体）过滤。
 */
export function buildFields<TBody extends object, TEntity extends TBody & object>(
  declared: PageFormField<TBody>[],
  fields: PageFieldsDictionary<TEntity>,
  i18nPrefix: string,
  buckets: PageEnums,
  ctx: PageContext,
) {
  return declared
    .filter((field) => !field.visible || field.visible(ctx))
    .map((field) => {
      const spec = fields[field.key]
      const enumId = field.enumId ?? spec?.enumId
      const options = enumId ? buckets[enumId] ?? [] : []
      const componentSpec = field.render ? undefined : resolveFieldSpec(field.component ?? 'input')
      if (enumId && !componentSpec?.mapOptions) {
        throw new Error(
          `[page-kit] 字段 ${field.key} 声明了 enumId，但组件 ${componentName(field.component)} 没有 mapOptions，options 会被丢掉：`
            + '用 defineFieldComponent 给它补 mapOptions，或者去掉 enumId（选项自己塞 props）',
        )
      }
      // 函数形态的 rules / props 拿实体：读 ctx.entity 会建立依赖，实体变了这里会重算
      const renderCtx: PageFieldRenderContext<TBody> = {
        entity: ctx.entity?.value as TBody,
        t: ctx.t,
        variant: ctx.variant,
        extra: ctx.extra,
      }
      return {
        key: field.key,
        label: resolveLabel(field.key, field.labelKey ?? spec?.labelKey, i18nPrefix),
        rules: typeof field.rules === 'function' ? field.rules(renderCtx) : field.rules,
        span: field.span ?? 12,
        render: field.render,
        component: componentSpec?.component,
        props: {
          ...componentSpec?.defaults,
          ...(options.length > 0 ? componentSpec?.mapOptions?.(options) ?? {} : {}),
          ...(typeof field.props === 'function' ? field.props(renderCtx) : field.props),
        },
      }
    })
}
