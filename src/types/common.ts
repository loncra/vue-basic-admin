import {
  CONFIG_PROVIDER,
  CONFIG_PROVIDER_THEME,
  SYSTEM_CONSTANT,
  TIME_UNIT_TYPE
} from '@/constants/systemConstant.ts'

/**
 * 通用类型与「数据访问服务」契约（接口层）
 *
 * ## 服务接口继承关系（能力由少到多）
 *
 * ```
 * DetailSearchService<TEntity>           // get(id)：按主键取详情
 *     │
 *     ├─► FindSearchService              // + find(FilterRequest)：条件列表
 *     │
 *     └─► PageSearchService              // + page(PageRequest)：分页列表
 *
 * DetailSearchService<TEntity>
 *     │
 *     └─► BasicCrudService               // + save(TBody)、delete(ids)：写操作
 *             │
 *             ├─► FindCurdService       // BasicCrud + FindSearch（详情 + 列表 + 写）
 *             │
 *             └─► PageCurdService         // BasicCrud + PageSearch（详情 + 分页 + 写）
 * ```
 *
 * 实现侧（`src/apis`）用 **类单继承** 拼出上述能力：`BasicRestfulCrudService` 在「详情」之上挂 `save/delete`，
 * `FindRestfulCrudService` / `PageRestfulCrudService` 再分别挂 `find` / `page`；只读搜索则用
 * `FindSearchRestfulService` / `PageSearchRestfulService` 直接从 `DetailSearchRestfulService` 分叉，避免带上写接口。
 *
 * @see {@link DetailSearchService} {@link FindSearchService} {@link PageSearchService}
 * @see {@link BasicCrudService} {@link FindCurdService} {@link PageCurdService}
 */

/**
 * 服务器响应数据结构
 * 统一的 REST API 响应格式，包含数据、状态码、消息等信息
 *
 * @template T - 响应数据的类型，默认为 unknown
 */
export interface RestResult<T = unknown> {
  /** 响应数据，成功时包含业务数据 */
  data?: T
  /** 业务执行状态码，例如 '200' 表示成功 */
  executeCode: string
  /** HTTP 状态码，例如 200、400、500 等 */
  status: number
  /** 响应时间戳 */
  timestamp: number
  /** 额外的元数据信息 */
  metadata?: Record<string, unknown>
  /** 响应消息，通常用于错误提示或成功提示 */
  message: string
}

/** 带主键 `id` 的最小实体形状（主键字段名由 {@link SYSTEM_CONSTANT.ID_NAME} 与具体实体约定） */
export interface BasicIdMetadata<T> {
  id: T
}

/** 带乐观锁版本号的实体元数据（常见于服务端返回的审计字段） */
export interface VersionEntityMetadata extends BasicIdMetadata<number> {
  creationTime?: number,
  version: number,
}

/**
 * ID-名称元数据结构
 * 常用于下拉选项、显示标签等场景
 */
export interface IdNameMetadata extends BasicIdMetadata<string> {
  /** 显示名称 */
  name: string
}

/**
 * ID-值元数据结构
 * 泛型结构，用于携带类型化的值
 *
 * @template T - 值的类型
 */
export interface IdValueMetadata<I, V>  extends BasicIdMetadata<I> {
  /** 实际值 */
  value: V,
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 名称枚举元数据结构（不带值类型）
 * 用于表示只有显示名称的枚举项
 * 例如菜单类型、资源类型等
 */
export interface NameEnumMetadata {
  /** 显示名称 */
  name: string
}

/**
 * 名称-值对结构（带值类型）
 * 用于表示带有显示名称和具体数值的键值对
 * 常用于枚举类型的数据展示
 *
 * @template T - 值的类型
 */
export interface NameValueEnumMetadata<T> extends NameEnumMetadata {
  /** 实际值 */
  value: T
}

/**
 * 自定义业务错误类
 * 用于表示业务逻辑层面的错误，包含业务状态码、HTTP 状态码等信息
 */
export class BusinessError extends Error {
  constructor(
    public executeCode: string,
    public status: number,
    public message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'BusinessError'

    // 保持原型链
    Object.setPrototypeOf(this, BusinessError.prototype)
  }
}

/**
 * 主题模式类型
 * 从 CONFIG_PROVIDER_THEME 常量推导的类型
 * 可以是：dark（深色）、light（浅色）或 system（跟随系统）
 */
export type ThemeMode =
  | typeof CONFIG_PROVIDER_THEME.DARK
  | typeof CONFIG_PROVIDER_THEME.LIGHT
  | typeof CONFIG_PROVIDER_THEME.SYSTEM

/**
 * 主题值类型
 * 实际应用的主题值，仅包含 dark 和 light
 * 不包含 system，因为 system 需要转换为具体的 dark 或 light
 */
export type ThemeValue = typeof CONFIG_PROVIDER_THEME.DARK | typeof CONFIG_PROVIDER_THEME.LIGHT


export type CreateSuccessBackValue = typeof CONFIG_PROVIDER.CREATE_SUCCESS_BACK.CURRENT | typeof CONFIG_PROVIDER.CREATE_SUCCESS_BACK.HOME

/**
 * 树形节点接口
 * 用于表示树形结构的数据节点，支持递归的父子关系
 *
 * @template T - 节点数据类型
 */
export type TreeLike<T> = T & {
  children?: TreeLike<T>[]
}

/**
 * 命令执行结果中的 data 结构（标准输出 / 错误 / 退出码）
 */
export interface RunCommandData {
  stdout: string
  stderr: string
  code: number
}

/**
 * 服务端推送事件（SSE）数据结构
 *
 * @template T - 数据内容的类型
 */
export interface ServerSentEvent<T> {
  /** 事件 ID */
  id: string
  /** 事件类型名称 */
  event: string
  /** 重连间隔（毫秒） */
  retry?: number
  /** 注释内容（服务端可发送以保持连接） */
  comment?: string
  /** 事件数据 payload */
  data?: T | string
}

/**
 * 列表 / 搜索通用过滤体
 * - 固定字段：`sort` 等
 * - 其余查询条件通过索引签名扩展（与后端 query 字段对齐）
 */
export interface FilterRequest {

  /**
   * 排序信息
   */
  sort?: IdNameMetadata[],

  /**
   * 附加内容
   */
  [key: string]: unknown
}

/**
 * 分页请求参数
 */
export interface PageRequest extends FilterRequest {
  /** 当前页码（从 1 开始） */
  number: number
  /** 每页条数 */
  size: number
}

/**
 * 滚动分页结果（基础）
 * 适用于无限滚动场景
 *
 * @template T - 列表元素类型
 */
export interface ScrollPageResult<T> {
  /** 当前页数据列表 */
  elements: T[]
  /** 元数据 */
  metadata: Record<string, unknown>
  /** 当前页元素数量 */
  numberOfElements: number
  /** 每页大小 */
  size: number
  /** 是否为最后一页 */
  last: boolean
}

/**
 * 标准分页结果
 * 在 ScrollPageResult 基础上增加页码信息
 *
 * @template T - 列表元素类型
 */
export interface PageResult<T> extends ScrollPageResult<T> {
  /** 当前页码 */
  number: number
  /** 是否为首页 */
  first: boolean
}

/**
 * 带总页数的分页结果
 * 适用于传统分页器场景
 *
 * @template T - 列表元素类型
 */
export interface TotalPage<T> extends PageResult<T> {
  /** 总记录数 */
  totalCount: number
  /** 总页数 */
  totalPages: number
}

/**
 * 通用权限码：详情、删除（列表行内与详情页可共用）
 */
export interface BasicAuthorityProps {
  detail?:string
  delete?:string
}

/**
 * 表格行级权限：在 {@link BasicAuthorityProps} 基础上增加「编辑」
 */
export interface TableAuthorityProps extends BasicAuthorityProps{
  edit?:string
}

/**
 * 工具栏按钮权限：在 {@link BasicAuthorityProps} 基础上增加「导出」「新增」
 */
export interface ButtonAuthorityProps extends BasicAuthorityProps {
  export?:string
  add?:string
}

/**
 * 只读详情契约：按主键拉取单条实体
 *
 * @typeParam TEntity - 实体类型，须含主键
 * @typeParam TId - 主键类型，默认取自 `TEntity[SYSTEM_CONSTANT.ID_NAME]`
 */
export interface DetailSearchService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]
> {
  /**
   * 获取数据
   *
   * @param id 主键
   */
  get(id: TId): Promise<RestResult<TEntity>>
}

/**
 * 只读「条件列表」契约：在 {@link DetailSearchService} 上增加 `find`
 * 与 {@link BasicCrudService} 无写操作组合，用于纯查询列表页
 */
export interface FindSearchService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]
> extends DetailSearchService<
  TEntity,
  TId
> {
  /**
   * 根据查询条件查找内容
   *
   * @param request 过滤条件
   */
  find(request: FilterRequest): Promise<RestResult<TEntity[]>>
}

/**
 * 只读「分页列表」契约：在 {@link DetailSearchService} 上增加 `page`
 */
export interface PageSearchService<
  TEntity extends BasicIdMetadata<TId>,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]
> extends DetailSearchService<
  TEntity,
  TId
> {
  /**
   * 获取分页内容
   *
   * @param request 分页请求体
   */
  page(request: PageRequest): Promise<RestResult<TPage>>
}

/**
 * 完整 CRUD 写契约：在 {@link DetailSearchService} 上增加 `save`、`delete`
 * （不包含列表查询；列表由 {@link FindSearchService} / {@link PageSearchService} 或组合接口提供）
 */
export interface BasicCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]
> extends DetailSearchService<
  TEntity,
  TId
>{

  /**
   * 保存数据
   *
   * @param entity
   */
  save(entity: TBody): Promise<RestResult<TId>>

  /**
   * 删除数据
   * @param ids - 主键集合
   */
  delete(ids: TId[]): Promise<RestResult<void>>
}

/**
 * 分页 CRUD：同时满足 {@link BasicCrudService} 与 {@link PageSearchService}
 * （详情 + 分页列表 + 增删改）
 */
export interface PageCurdService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]
> extends BasicCrudService<
  TBody,
  TEntity,
  TId
>, PageSearchService<TEntity, TPage, TId> {

}

/**
 * 条件列表 CRUD：同时满足 {@link BasicCrudService} 与 {@link FindSearchService}
 * （详情 + 条件列表 + 增删改）
 */
export interface FindCurdService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]
> extends BasicCrudService<
  TBody,
  TEntity,
  TId
>, FindSearchService<TEntity, TId> {

}

/**
 * 时间单位类型（与 {@link TIME_UNIT_TYPE} 常量对应）
 */
export type TimeUnitType =
  | typeof TIME_UNIT_TYPE.HOURS
  | typeof TIME_UNIT_TYPE.MINUTES
  | typeof TIME_UNIT_TYPE.DAYS
  | typeof TIME_UNIT_TYPE.SECONDS
  | typeof TIME_UNIT_TYPE.MILLISECONDS
  | typeof TIME_UNIT_TYPE.MICROSECONDS
  | typeof TIME_UNIT_TYPE.NANOSECONDS

/**
 * 时间配置
 */
export interface TimeProperties {
  /**
   * 时间值
   */
  value: number
  /**
   * 单位
   */
  unit: TimeUnitType
}

export interface IconfontGlyph {
  font_class: string
  name: string
  icon_id:string
  unicode:string
  unicode_decimal:number
}
export interface IconfontJson {
  name: string
  css_prefix_text: string
  description:string
  glyphs: IconfontGlyph[]
}
