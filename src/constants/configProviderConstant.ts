
export type CreateSuccessBackValue = typeof CREATE_SUCCESS_BACK.CURRENT | typeof CREATE_SUCCESS_BACK.HOME

export const CREATE_SUCCESS_BACK = {
  CURRENT: 'current',
  HOME: 'home'
}

export const SCREEN_BREAKPOINT = {
  SCREEN_XXXL: 'screenXXXL',
  SCREEN_XXL: 'screenXXL',
  SCREEN_XL: 'screenXL',
  SCREEN_LG: 'screenLG',
  SCREEN_MD: 'screenMD',
  SCREEN_SM: 'screenSM',
  SCREEN_XS: 'screenXS',
}

export const PAD_SCREENS: readonly string[] = [
  SCREEN_BREAKPOINT.SCREEN_LG,
  SCREEN_BREAKPOINT.SCREEN_MD,
  SCREEN_BREAKPOINT.SCREEN_SM,
  SCREEN_BREAKPOINT.SCREEN_XS,
]
