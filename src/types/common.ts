import {CONFIG_PROVIDER_THEME, TIME_UNIT_TYPE} from '@/constants/systemConstant.ts'

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

/**
 * 名称-值对结构（带值类型）
 * 用于表示带有显示名称和具体数值的键值对
 * 常用于枚举类型的数据展示
 *
 * @template T - 值的类型
 */
export interface NameValueEnumMetadata<T> {
  /** 显示名称 */
  name: string
  /** 实际值 */
  value: T
}

/**
 * ID-名称元数据结构
 * 常用于下拉选项、显示标签等场景
 */
export interface IdNameMetadata {
  /** 显示名称 */
  name: string
  /** 唯一标识 ID */
  id: string
}

/**
 * ID-值元数据结构
 * 泛型结构，用于携带类型化的值
 *
 * @template T - 值的类型
 */
export interface IdValueMetadata<T> {
  /** 唯一标识 ID */
  id: string
  /** 实际值 */
  value: T,
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
 * 命令执行结果 data 结构（
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
 * 分页请求参数
 */
export interface PageRequest {
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
 * 登录方式类型
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
