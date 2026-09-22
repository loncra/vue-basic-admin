/**
 * 宿主的**配置 store**（只剩宿主自己那两半）：
 * - 布局偏好：首页侧边栏宽度 / 折叠宽度 / 可折叠 / 屏幕断点；
 * - 业务偏好：创建成功后的去向、message / notification 配置。
 *
 * antdv 那半（主题 / 语言 / 组件尺寸 / token / formLayout / detailLayout）已经归
 * `@loncra/antdv-pro` 的配置实例，宿主那份在 `@/stores/antdvConfig`（初值、持久化、
 * `<html data-theme>`、i18n / dayjs 同步都在那里）。
 */
import {computed, type ComputedRef, onMounted, onUnmounted, ref} from 'vue'
import {defineStore} from 'pinia'
import {theme} from 'antdv-next'
import {
  type CreateSuccessBackValue,
  PAD_SCREENS,
  SCREEN_BREAKPOINT,
  STORE,
} from '@/constants'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {ConfigOptions} from 'antdv-next/dist/message/interface'
import type {GlobalConfigProps} from 'antdv-next/dist/notification/interface'
import type {ConfigProviderState, ConfigProviderStoredState} from '@/types/composables'

const LEGACY_KEY = import.meta.env.VITE_APP_LOCAL_STORAGE_CONFIG_PROVIDER_NAME
/** 宿主这半单独一个键：`antdvConfig` 那份也写老键，各写各的不会互相覆盖 */
const STORAGE_KEY = `${LEGACY_KEY}:layout`

const DEFAULTS: ConfigProviderStoredState = {
  homeSiderWidth: 260,
  homeCollapsedWidth: 84,
  homeCollapsible: false,
  createSuccessBack: undefined,
  messageConfig: {maxCount: 1} as ConfigOptions,
  notificationConfig: {placement: 'bottomRight', maxCount: 6, showProgress: true} as GlobalConfigProps,
}

/** 先读新键；没有就**从老键迁一次**（老版本的 JSON 里这些字段就在同一份里） */
function readStored(): Partial<ConfigProviderStoredState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    return raw ? (JSON.parse(raw) as Partial<ConfigProviderStoredState>) : {}
  } catch {
    return {}
  }
}

export const useConfigProviderStore = defineStore(STORE.CONFIG_PROVIDER_ID, () => {
  // Ant Design 的 token：**视图值**（间距、尺寸），不是状态 —— 页面用它算 spacing/尺寸
  const {useToken} = theme
  const {token} = useToken()

  const state = ref<ConfigProviderState>($reset())

  /** 按当前窗口宽度算屏幕断点（宽度取自 antdv token 的断点值） */
  function calculateScreenBreakpoint(width: number): NameValueEnumMetadata<number> {
    const currentToken = token.value
    const breakpoints: NameValueEnumMetadata<number>[] = [
      {name: SCREEN_BREAKPOINT.SCREEN_XXXL, value: currentToken.screenXXXL || 2000},
      {name: SCREEN_BREAKPOINT.SCREEN_XXL, value: currentToken.screenXXL || 1600},
      {name: SCREEN_BREAKPOINT.SCREEN_XL, value: currentToken.screenXL || 1200},
      {name: SCREEN_BREAKPOINT.SCREEN_LG, value: currentToken.screenLG || 992},
      {name: SCREEN_BREAKPOINT.SCREEN_MD, value: currentToken.screenMD || 768},
      {name: SCREEN_BREAKPOINT.SCREEN_SM, value: currentToken.screenSM || 576},
      {name: SCREEN_BREAKPOINT.SCREEN_XS, value: currentToken.screenXS || 480},
    ]
    const result: NameValueEnumMetadata<number> = {name: SCREEN_BREAKPOINT.SCREEN_XS, value: 480}
    for (const breakpoint of breakpoints) {
      if (width <= breakpoint.value) {
        result.name = breakpoint.name
        result.value = breakpoint.value
      }
    }
    return result
  }

  function isPadScreen(): boolean {
    return PAD_SCREENS.includes(state.value.screen.name)
  }

  function updateScreenBreakpoint(): void {
    state.value.screen = calculateScreenBreakpoint(window.innerWidth)
    state.value.homeCollapsible = isPadScreen()
  }

  /** Ant Design 的 token 表（视图值；要单个键就用 `getToken()` 自己取） */
  const getToken: ComputedRef<() => typeof token.value> = computed(() => () => token.value)

  function setHomeSiderWidth(width: number): void {
    state.value.homeSiderWidth = width
    saveLocalStorage()
  }

  function setHomeCollapsedWidth(width: number): void {
    state.value.homeCollapsedWidth = width
    saveLocalStorage()
  }

  function setHomeCollapsible(collapsible: boolean): void {
    state.value.homeCollapsible = collapsible
    saveLocalStorage()
  }

  function setCreateSuccessBack(value: CreateSuccessBackValue): void {
    state.value.createSuccessBack = value
    saveLocalStorage()
  }

  /** 高亮文本中的指定内容（列表搜索命中项那类展示） */
  function highlightedText(text: string = '', replace: string = ''): string {
    const regex = new RegExp(`(${replace})`, 'gi')
    return (
      '<span>' +
      text.replace(
        regex,
        `<span style="background: ${token.value.colorWarning};padding: 0 ${token.value.paddingXXS}px;font-weight: bold">$1</span>`,
      ) +
      '</span>'
    )
  }

  function saveLocalStorage(): void {
    // `state.value` 的类型是深层解包过的，直接标注会触发 TS 的深度实例化限制 ⇒ 这里按"要存的形状"取一次
    const current = state.value as ConfigProviderStoredState
    const storedValue: ConfigProviderStoredState = {
      homeSiderWidth: current.homeSiderWidth,
      homeCollapsedWidth: current.homeCollapsedWidth,
      homeCollapsible: current.homeCollapsible,
      createSuccessBack: current.createSuccessBack,
      messageConfig: current.messageConfig,
      notificationConfig: current.notificationConfig,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedValue))
  }

  function $reset(): ConfigProviderState {
    const stored = readStored()
    return {
      ...DEFAULTS,
      ...stored,
      messageConfig: {...DEFAULTS.messageConfig, ...stored.messageConfig} as ConfigOptions,
      notificationConfig: {
        ...DEFAULTS.notificationConfig,
        ...stored.notificationConfig,
        bottom: token.value.sizeXL,
      } as GlobalConfigProps,
      screen: calculateScreenBreakpoint(window.innerWidth),
    }
  }

  const handleResize = (): void => {
    updateScreenBreakpoint()
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    updateScreenBreakpoint()
  })

  onUnmounted(() => window.removeEventListener('resize', handleResize))

  // 初始化时把状态写回新键：老键里的布局项借此完成迁移，之后两边各写各的
  saveLocalStorage()

  return {
    /** 响应式状态对象 */
    state,
    /** Ant Design 的 token（视图值） */
    getToken,
    /** 是否窄屏（平板/手机） */
    isPadScreen,
    setHomeSiderWidth,
    setHomeCollapsedWidth,
    setHomeCollapsible,
    setCreateSuccessBack,
    /** 高亮文本中的指定内容 */
    highlightedText,
    /** 重置状态为初始值 */
    $reset,
  }
})
