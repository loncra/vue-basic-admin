import type {NameValueEnumMetadata} from "@/types/apis";
import {CONFIG_PROVIDER, CONFIG_PROVIDER_THEME} from "@/constants/systemConstant.ts";

import {theme} from 'antdv-next'

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
  algorithm: typeof theme.darkAlgorithm | typeof theme.defaultAlgorithm | null
  /** 当前屏幕断点信息，根据窗口宽度自动计算 */
  screen: NameValueEnumMetadata<number>
}
