import type {NameValueEnumMetadata} from "@loncra/client/commons";
import {type CreateSuccessBackValue} from '@/constants';
import type {GlobalConfigProps} from "antdv-next/dist/notification/interface";
import type {ConfigOptions} from "antdv-next/dist/message/interface";

/**
 * 宿主自己的那份配置（**antdv 那半已经交给 pro**：主题 / 语言 / 尺寸 / token / 布局
 * 都在 `@/stores/antdvConfig` 的 `antdvConfig` 实例里）。
 * 这些值会被持久化保存（键见 store）。
 */
export interface ConfigProviderStoredState {
  /** 首页侧边栏宽度 */
  homeSiderWidth: number
  /** 首页侧边栏折叠时的宽度 */
  homeCollapsedWidth: number
  /** 首页侧边栏是否可折叠 */
  homeCollapsible: boolean
  /** 创建记录成功后的去向 */
  createSuccessBack?: CreateSuccessBackValue
  messageConfig: ConfigOptions
  notificationConfig: GlobalConfigProps
}

/**
 * 配置提供者状态接口
 * 扩展了 StoredStateValue，添加了运行时状态
 */
export interface ConfigProviderState extends ConfigProviderStoredState {
  /** 当前屏幕断点信息，根据窗口宽度自动计算（运行时值，不持久化） */
  screen: NameValueEnumMetadata<number>
}
