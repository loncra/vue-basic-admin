import type {NameValueEnumMetadata} from "@/types/apis";
import {
  type CreateSuccessBackValue,
  type ThemeMode,
  type ThemeValue
} from "@/constants/configProviderConstant.ts";
import type {MappingAlgorithm} from "antdv-next/dist/theme";

/**
 * 存储在 localStorage 中的状态值
 * 这些值会被持久化保存
 */
export interface ConfigProviderStoredState {
  /** 主题模式：深色/浅色/系统 */
  mode: ThemeMode
  /** 当前主题值 */
  theme: ThemeValue
  /** 首页侧边栏折叠时的宽度 */
  homeCollapsedWidth: number
  /** 首页侧边栏是否可折叠 */
  homeCollapsible: boolean
  /** 表单布局方式 */
  formLayout: string
  /** 明细页布局方式 */
  detailLayout:string
  /** 首页侧边栏宽度 */
  homeSiderWidth: number
  /** 当前语言环境 */
  locale: string
  /** 主题 token */
  token: Record<string, unknown>
  /** 组件默认大小 */
  componentSize:string
  /** 紧凑型 */
  compact:boolean
  /**
   * 创建成功后的跳转位置
   */
  createSuccessBack?:CreateSuccessBackValue
}

/**
 * 配置提供者状态接口
 * 扩展了 StoredStateValue，添加了运行时状态
 */
export interface ConfigProviderState extends ConfigProviderStoredState {
  /** Ant Design Vue 主题算法（深色/浅色） */
  algorithm: MappingAlgorithm
  /** 当前屏幕断点信息，根据窗口宽度自动计算 */
  screen: NameValueEnumMetadata<number>
}
