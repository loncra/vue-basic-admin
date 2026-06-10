
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

export type CreateSuccessBackValue = typeof CREATE_SUCCESS_BACK.CURRENT | typeof CREATE_SUCCESS_BACK.HOME

/**
 * 主题模式类型
 */
export const CONFIG_PROVIDER_THEME = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
  ICON: {
    system: 'loncra-sun-moon',
    dark: 'loncra-moon',
    light: 'loncra-sun-medium',
  }
} as const

export const MATCH_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const STORED_STATE_VALUE = {
  mode: CONFIG_PROVIDER_THEME.SYSTEM,
  homeCollapsedWidth: 84,
  collapsible: false,
  formLayout: 'vertical',
  homeSiderWidth: 260,
  token: {},
  componentSize: 'middle',
  compact: false,
  detailLayout: 'vertical',
}

export const CREATE_SUCCESS_BACK = {
  CURRENT: 'current',
  HOME: 'home'
}

/**
 * 屏幕断点常量
 *
 * 用于响应式设计，对应 Ant Design Vue 的屏幕断点 token
 * 这些值用于判断当前屏幕尺寸，便于做响应式布局和功能调整
 *
 * @example
 * // 判断是否为平板大小
 * if (screen === SCREEN_BREAKPOINT.SCREEN_MD || screen === SCREEN_BREAKPOINT.SCREEN_LG) {
 *   // 平板布局逻辑
 * }
 */
export const SCREEN_BREAKPOINT = {
  /** 超超超大屏幕 (≥2000px) */
  SCREEN_XXXL: 'screenXXXL',
  /** 超超大屏幕 (≥1600px) */
  SCREEN_XXL: 'screenXXL',
  /** 超大屏幕 (≥1200px) */
  SCREEN_XL: 'screenXL',
  /** 大屏幕 (≥992px) - 笔记本 */
  SCREEN_LG: 'screenLG',
  /** 中等屏幕 (≥768px) - 平板 */
  SCREEN_MD: 'screenMD',
  /** 小屏幕 (≥576px) - 大屏手机 */
  SCREEN_SM: 'screenSM',
  /** 超小屏幕 (<576px) - 手机 */
  SCREEN_XS: 'screenXS',
}

/**
 * 平板一下的尺寸名称
 */
export const PAD_SCREENS: readonly string[] = [
  SCREEN_BREAKPOINT.SCREEN_LG,
  SCREEN_BREAKPOINT.SCREEN_MD,
  SCREEN_BREAKPOINT.SCREEN_SM,
  SCREEN_BREAKPOINT.SCREEN_XS,
]
