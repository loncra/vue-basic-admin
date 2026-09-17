import type {Component, Ref} from 'vue'
import type {FormItemProps, TableProps} from 'antdv-next'
import type {ActionDefinition, AuthorityProps} from '@loncra/antdv-pro'
import type {
  BasicCrudService,
  BasicIdMetadata,
  DetailSearchService,
  NameValueEnumMetadata,
  SYSTEM_CONSTANT,
} from '@loncra/client/commons'
import type {Router} from 'vue-router'

/**
 * 页面声明（DSL）。
 *
 * 结构 = **字段字典（唯一事实来源）+ 三种形态的条目**：
 * - `fields`：`labelKey` / `format` / `enumId` 这种"字段自身"的属性，只写一次；
 * - `list` / `form` / `detail`：只写该形态专属的东西（宽度、搜索、组件、栅格…）。
 *   条目可以写裸 key（`'name'`，等价于 `{key: 'name'}`），也可以顺带覆盖字典里的那三个属性。
 *
 * 设计纪律（rule of three）：**只有出现 3 次以上的东西才允许进这里**，
 * 否则一律用 `render` / 插槽 / 干脆手写页面。DSL 越小活得越久。
 *
 * 本文件只有类型；`defineCrudPage` 是恒等函数，渲染时不做任何解析。
 */

/** 注册表 key：内置值有补全提示，同时允许自定义（见 `defineFormatter` / `defineFieldComponent`） */
type BuiltinKey<T extends string> = T | (string & {})

/** 值格式名（内置 `'enum'` / `'enumList'`，见 field.ts 的 FORMATTERS） */
export type PageValueFormat = BuiltinKey<'enum' | 'enumList'>

/** 字段组件名（内置 input/password/textarea/number/select/date/dateRange，见 field.ts 的 FIELD_COMPONENTS） */
export type PageFieldComponent = BuiltinKey<
  'input' | 'password' | 'textarea' | 'number' | 'select' | 'date' | 'dateRange'
>

/** 枚举桶：id → `{name, value}[]` */
export type PageEnums = Record<string, NameValueEnumMetadata<number | string>[]>

/**
 * 逃逸函数 / 可见性判定拿到的上下文，由渲染器注入。
 *
 * `variant` 是**宿主命名的形态**：整页是 `PAGE_VARIANT`（见 field.ts），内嵌时宿主自己起名。
 * 两边都用常量，DSL 侧写 `visible: ({variant}) => variant !== 宿主那个常量`，
 * 不要出现"内嵌/embedded"这类词，也不要写裸字面量。
 * `extra` 是壳自己放进去的东西（子表 ref、查询条件等），用于声明管不到的那部分。
 */
export interface PageContext {
  router: Router
  t: (key: string, named?: Record<string, unknown>) => string
  extra: Record<string, unknown>
  variant: string
  /** 表单渲染器持有的实体（`preMounted` 里写初值时会用到） */
  entity?: Ref<Record<string, unknown>>
}

/** 字段字典：字段自身的属性，三种形态共用；形态条目里写了就以条目为准 */
export interface PageFieldSpec {
  labelKey?: string
  /** formatter 名。声明即断言值的形状，见 field.ts 的 FORMATTERS */
  format?: PageValueFormat
  /** 枚举桶 id：列表补搜索下拉的 options，表单补组件的 options */
  enumId?: string
}

/** 字段字典（按实体字段名索引） */
export type PageFieldsDictionary<TEntity> = Partial<Record<keyof TEntity & string, PageFieldSpec>>

/** 列表列 */
export interface PageListColumn<TEntity> {
  key: keyof TEntity & string
  /** 覆盖字典 */
  labelKey?: string
  format?: PageValueFormat
  enumId?: string
  width?: number
  ellipsis?: boolean
  /** 声明式搜索项 */
  search?: {
    component: PageFieldComponent | Component
    expression?: string
    /** 组件 props，直接写目标组件的东西（多选就是 `{mode: 'multiple'}`，表单侧同样写法） */
    props?: Record<string, unknown>
  }
  /**
   * 逃生：自定义这一格的内容。返回值直接交给表格渲染（string / VNode 都行）；
   * 返回 `undefined` 表示不认领，交回表格渲染它自己算好的内容。
   */
  render?: (value: unknown, record: TEntity) => unknown
  /** 该形态下是否显示这一列；缺省显示（用 `ctx.variant` 判断宿主形态） */
  visible?: (ctx: PageContext) => boolean
}

/** 列表条目：裸 key 或完整列 */
export type PageListEntry<TEntity> = (keyof TEntity & string) | PageListColumn<TEntity>

/** 详情项 */
export interface PageDetailItem<TEntity> {
  key: keyof TEntity & string
  /** 覆盖字典 */
  labelKey?: string
  format?: PageValueFormat
  /** a-descriptions 的跨列数 */
  span?: number
  /** 逃生：自定义这一项的内容（string / VNode） */
  render?: (value: unknown, record: TEntity) => unknown
}

/** 详情条目：裸 key 或完整项 */
export type PageDetailEntry<TEntity> = (keyof TEntity & string) | PageDetailItem<TEntity>

/**
 * 表单字段 `render` 拿到的东西：**裸实体**（读值用）+ `t` + 宿主形态。
 * 要写初值用页级钩子的 `PageContext`（那里 `entity` 是 `Ref`，因为钩子要写）。
 */
export interface PageFieldRenderContext<TBody> {
  entity: TBody
  t: PageContext['t']
  variant: string
}

/** 表单字段 */
export interface PageFormField<TBody> {
  key: keyof TBody & string
  /** 覆盖字典 */
  labelKey?: string
  enumId?: string
  /** 注册表 key，或直接给组件（editor / icon-select / attachment-upload 这类包内控件） */
  component?: PageFieldComponent | Component
  rules?: FormItemProps['rules']
  /** 24 栅格跨度，默认 12 */
  span?: number
  props?: Record<string, unknown>
  /**
   * 该形态下是否显示；缺省显示。
   * 新增/编辑两态不一致时用它：`visible: ({entity}) => !entity?.value.id`（只在新增时出现）
   */
  visible?: (ctx: PageContext) => boolean
  /** 逃生：完全自定义这个控件（与 `component` 二选一） */
  render?: (ctx: PageFieldRenderContext<TBody>) => unknown
}

export interface PageListDefinition<TEntity extends BasicIdMetadata<unknown>> {
  authority?: AuthorityProps
  /**
   * 需要预加载的枚举桶 id，写 `@loncra/client/commons` 的常量，别写字符串：
   * `[SYSTEM_ENUM_TYPE.YES_OR_NO, SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM]`
   */
  enums?: string[]
  /** 列顺序 = 数组顺序；按形态显隐用列自己的 `visible` */
  columns: PageListEntry<TEntity>[]
  rowSelection?: TableProps['rowSelection'] | false
  /**
   * 行内动作。函数形态用于需要 router、或按 `ctx.variant` 裁剪动作集合的场景
   * （单个动作的按行显隐仍用 `ActionDefinition.visible`）。
   */
  rowActions?:
    | ActionDefinition<TEntity>[]
    | ((ctx: PageContext) => ActionDefinition<TEntity>[])
}

export interface PageFormDefinition<TBody, TEntity> {
  fields: PageFormField<TBody>[]
  /** 实体初值：等价于现在每个 Form 手写的那坨 entity ref */
  createEntity: () => TBody
  titleText?: (title: string, entity: TEntity | TBody, ctx: PageContext) => string
  preMounted?: (ctx: PageContext) => void | Promise<void>
  postMounted?: () => void | Promise<void>
  preSubmit?: () => void | Promise<void>
  postGetEntity?: (entity: TEntity, ctx: PageContext) => TEntity | Promise<TEntity>
}

export interface PageDetailDefinition<TEntity> {
  fields: PageDetailEntry<TEntity>[]
  /** a-descriptions 的响应式列数，省略用内置默认 */
  column?: Record<string, number>
  titleText?: (title: string, entity: TEntity, ctx: PageContext) => string
  postGetEntity?: (entity: TEntity, ctx: PageContext) => TEntity | Promise<TEntity>
}

export interface CrudPageDefinition<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: BasicCrudService<TBody, TEntity>
  detailService?: DetailSearchService<TEntity>
  /** 主键字段名；不传时表格用 `SYSTEM_CONSTANT.ID_NAME` */
  rowKey?: keyof TEntity & string
  /** 列/字段 label 的 i18n 前缀，如 'authServer.role' */
  i18nPrefix: string
  routes?: {home?: string; add?: string; edit?: string; detail?: string}
  operationDataTraceTarget?: string
  /** 字段字典：labelKey / format / enumId 的唯一事实来源 */
  fields?: PageFieldsDictionary<TEntity>
  list?: PageListDefinition<TEntity>
  form?: PageFormDefinition<TBody, TEntity>
  detail?: PageDetailDefinition<TEntity>
}
