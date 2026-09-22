
export type CreateSuccessBackValue = typeof CREATE_SUCCESS_BACK.CURRENT | typeof CREATE_SUCCESS_BACK.HOME

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
