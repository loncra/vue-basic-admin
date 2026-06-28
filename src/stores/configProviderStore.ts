/**
 * 配置提供者 Store
 *
 * 用于管理全局配置状态，包括：
 * - 主题模式（深色/浅色/系统）
 * - 国际化语言设置
 * - 布局配置（侧边栏宽度、可折叠等）
 * - 屏幕断点响应式信息
 *
 * @author maurice.chen
 */

import {
  computed,
  type ComputedRef,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
  type UnwrapRef
} from 'vue'
import {defineStore} from 'pinia'
import {theme} from 'antdv-next'
import {STORE} from '@/constants/systemConstant'

import {
  CONFIG_PROVIDER_THEME,
  type CreateSuccessBackValue,
  MATCH_MEDIA_QUERY,
  PAD_SCREENS,
  SCREEN_BREAKPOINT,
  STORED_STATE_VALUE,
  type ThemeMode,
  type ThemeValue,
} from '@/constants/configProviderConstant'

import i18n, {type LanguagePack} from '@/i18n'
import type {NameValueEnumMetadata} from '@/types/apis'
import type {ConfigProviderState, ConfigProviderStoredState,} from '@/types/composables'

import type {ComposerTranslation} from 'vue-i18n'
import dayjs from 'dayjs'
import type {MappingAlgorithm} from "antdv-next/dist/theme";

/**
 * 配置提供者 Store
 *
 * @returns 配置提供者相关的状态和方法
 */
export const useConfigProviderStore = defineStore(STORE.CONFIG_PROVIDER_ID, () => {
  // 获取 Ant Design Vue 的 theme token，用于访问设计系统的值
  const {useToken} = theme
  const {token} = useToken()

  // 从 localStorage 读取已保存的配置
  const storedValue = localStorage.getItem(
    import.meta.env.VITE_APP_LOCAL_STORAGE_CONFIG_PROVIDER_NAME,
  )

  // 响应式状态
  const state: Ref<UnwrapRef<ConfigProviderState>, UnwrapRef<ConfigProviderState> | ConfigProviderState> = ref(reset())

  /**
   * 根据当前窗口宽度计算对应的屏幕断点
   *
   * 算法逻辑：
   * 1. 从大到小遍历所有断点（screenXXXL → screenXXL → ... → screenXS）
   * 2. 找到第一个小于等于当前宽度的断点
   * 3. 如果所有断点都小于当前宽度，返回最小的断点（screenXS）
   *
   * @param width 窗口宽度（像素）
   * @returns 屏幕断点的 NameValueEnumMetadata，包含断点名称和对应的宽度值
   *
   * @example
   * // 窗口宽度为 1200px 时
   * calculateScreenBreakpoint(1200) // { name: 'screenXL', value: 1200 }
   *
   * // 窗口宽度为 800px 时
   * calculateScreenBreakpoint(800) // { name: 'screenMD', value: 768 }
   */
  function calculateScreenBreakpoint(width: number): NameValueEnumMetadata<number> {
    const currentToken = token.value

    // 定义屏幕断点，按从大到小排序
    // 使用 Ant Design Vue 的 token 值，如果没有则使用默认值
    const breakpoints: NameValueEnumMetadata<number>[] = [
      {name: SCREEN_BREAKPOINT.SCREEN_XXXL, value: currentToken.screenXXXL || 2000},
      {name: SCREEN_BREAKPOINT.SCREEN_XXL, value: currentToken.screenXXL || 1600},
      {name: SCREEN_BREAKPOINT.SCREEN_XL, value: currentToken.screenXL || 1200},
      {name: SCREEN_BREAKPOINT.SCREEN_LG, value: currentToken.screenLG || 992},
      {name: SCREEN_BREAKPOINT.SCREEN_MD, value: currentToken.screenMD || 768},
      {name: SCREEN_BREAKPOINT.SCREEN_SM, value: currentToken.screenSM || 576},
      {name: SCREEN_BREAKPOINT.SCREEN_XS, value: currentToken.screenXS || 480},
    ]

    // 兜底返回 screenXS（理论上不会执行到这里）
    const result: NameValueEnumMetadata<number> = {name: SCREEN_BREAKPOINT.SCREEN_XS, value: 480}
    // 找到第一个小于等于当前宽度的断点
    // 例如：宽度为 1200px 时，会匹配到 screenXL（1200）
    for (const breakpoint of breakpoints) {
      if (width <= breakpoint.value) {
        result.name = breakpoint.name
        result.value = breakpoint.value
      }
    }

    return result
  }

  function isPadScreen() {
    return PAD_SCREENS.includes(state.value.screen.name)
  }

  /**
   * 更新屏幕断点
   *
   * 根据当前窗口宽度重新计算并更新 state.screen 的值
   * 通常在窗口大小变化或 token 变化时调用
   */
  function updateScreenBreakpoint(): void {
    const width = window.innerWidth
    state.value.screen = calculateScreenBreakpoint(width)
    state.value.homeCollapsible = isPadScreen();
  }

  /**
   * 重置状态为初始值
   *
   * 从 localStorage 读取已保存的配置，如果没有则使用默认值
   * 同时初始化 screen 属性为当前窗口宽度对应的断点
   *
   * @returns 初始化后的 ConfigProviderState
   */
  function reset(): ConfigProviderState {
    return $reset()
  }

  /**
   * 获取 Ant Design Vue 的 theme token
   *
   * @returns 返回一个函数，调用该函数可获取当前的 token 值
   */
  const getToken: ComputedRef<() => typeof token.value> = computed(() => () => {
    return token.value
  })

  function getTokenValue(key: string): string {
    if (state.value.token && state.value.token[key]) {
      return state.value.token[key] as unknown as string;
    }
    return token.value[key as keyof typeof token.value] as string
  }

  function getAlgorithm():MappingAlgorithm | MappingAlgorithm[] | undefined {
    return state.value.compact ? [state.value.algorithm, theme.compactAlgorithm] : state.value.algorithm;
  }

  function isScalarTokenValue(v: unknown): v is string | number {
    return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  }

  /**
   * 按 key 写入 theme token（仅允许覆盖当前即为 string | number 的字段；新值也须为 string | number）。
   * 组件级嵌套对象等字段会被跳过，避免误写坏主题结构。
   */
  function setTokenValue(key: string, value: string | number | boolean): void {
    if (!isScalarTokenValue(value)) {
      return
    }
    const tk = token.value as unknown as Record<string, unknown>
    const current = tk[key]
    if (!isScalarTokenValue(current)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[configProviderStore] setTokenValue skipped: "${key}" is not a scalar token (current type: ${current === undefined ? 'undefined' : typeof current})`,
        )
      }
      return
    }
    if (!state.value.token) {
      state.value.token = {}
    }
    state.value.token[key] = value
    saveLocalStorage()
  }

  /**
   * 设置首页侧边栏宽度
   *
   * @param width 侧边栏宽度（像素）
   */
  function setHomeSiderWidth(width: number): void {
    state.value.homeSiderWidth = width
    saveLocalStorage()
  }

  /**
   * 设置首页侧边栏是否可折叠
   *
   * @param collapsible 是否可折叠
   */
  function setHomeCollapsible(collapsible: boolean): void {
    state.value.homeCollapsible = collapsible
    saveLocalStorage()
  }

  function setComponentSize(size: string): void {
    state.value.componentSize = size
    saveLocalStorage()
  }

  function setCompact(compact: boolean): void {
    state.value.compact = compact
    saveLocalStorage()
  }

  /**
   * 设置主题算法
   *
   * @param algorithm Ant Design Vue 的主题算法（深色/浅色）
   */
  function setAlgorithm(
    algorithm: MappingAlgorithm,
  ): void {
    state.value.algorithm = algorithm
    saveLocalStorage()
  }

  function setCreateSuccessBack(value: CreateSuccessBackValue) {
    state.value.createSuccessBack = value
    saveLocalStorage()
  }

  /**
   * 切换主题模式
   *
   * @param isDarkMode 是否为深色模式
   */
  function changeMode(isDarkMode: boolean): void {
    setAlgorithm(isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm)
    setTheme(isDarkMode ? CONFIG_PROVIDER_THEME.DARK : CONFIG_PROVIDER_THEME.LIGHT)
  }

  /**
   * 获取当前主题值
   *
   * 如果模式为 SYSTEM，则根据系统偏好自动判断
   * 否则返回用户设置的模式
   *
   * @returns 当前主题值（DARK 或 LIGHT）
   */
  function getTheme(): ThemeValue {
    if (state.value.mode === CONFIG_PROVIDER_THEME.SYSTEM) {
      return window.matchMedia(MATCH_MEDIA_QUERY).matches
        ? CONFIG_PROVIDER_THEME.DARK
        : CONFIG_PROVIDER_THEME.LIGHT
    } else {
      return state.value.mode
    }
  }

  /**
   * 设置主题值
   *
   * @param value 主题值（DARK 或 LIGHT）
   */
  function setTheme(value: ThemeValue): void {
    state.value.theme = value
    saveLocalStorage()
  }

  /**
   * 保存状态到 localStorage
   *
   * 只保存 StoredStateValue 中定义的字段，不保存运行时状态（如 algorithm、screen）
   */
  function saveLocalStorage(): void {
    const storedValue: ConfigProviderStoredState = {
      mode: state.value.mode,
      theme: state.value.theme,
      homeCollapsedWidth: state.value.homeCollapsedWidth,
      homeCollapsible: state.value.homeCollapsible,
      homeSiderWidth: state.value.homeSiderWidth,
      formLayout: state.value.formLayout,
      detailLayout: state.value.detailLayout,
      locale: state.value.locale,
      token: state.value.token,
      componentSize: 'middle',
      compact: false,
      createSuccessBack: state.value.createSuccessBack,
      messageConfig:{
        maxCount:1
      },
      notificationConfig:{ placement: 'bottomRight',maxCount:6, showProgress: true, bottom: token.value.sizeXL}
    }
    localStorage.setItem(
      import.meta.env.VITE_APP_LOCAL_STORAGE_CONFIG_PROVIDER_NAME,
      JSON.stringify(storedValue),
    )
  }

  /**
   * 当前语言环境的翻译消息
   *
   * 根据 state.locale 自动获取对应的翻译对象
   */
  const localeMessage: ComputedRef<object> = computed(
    () =>
      (i18n.global.messages.value as Record<string, ComposerTranslation>)[state.value.locale] || {},
  )

  /**
   * 获取所有可用的语言环境列表
   *
   * @returns 语言环境列表，包含名称和值
   */
  function getLocales(): NameValueEnumMetadata<string>[] {
    const result: NameValueEnumMetadata<string>[] = []
    const messages = i18n.global.messages.value as Record<string, LanguagePack>
    for (const key in messages) {
      const locale = messages[key]
      if (!locale) {
        continue
      }
      result.push({name: locale.name, value: locale.value})
    }
    return result
  }

  /**
   * 切换语言环境
   *
   * @param locale 语言环境代码（如 'zh-CN', 'en-US'）
   */
  function changeLocale(locale: string) {
    state.value.locale = locale
    i18n.global.locale.value = state.value.locale
    const dayjsLocale = (i18n.global.messages.value as Record<string, LanguagePack>)[state.value.locale]?.dayjs as string
    dayjs.locale(dayjsLocale)
    saveLocalStorage()
  }

  /**
   * 设置主题模式
   *
   * 如果模式为 SYSTEM，会监听系统主题变化并自动切换
   * 否则直接应用用户选择的模式
   *
   * @param mode 主题模式（DARK / LIGHT / SYSTEM）
   */
  function setMode(mode: ThemeMode): void {
    state.value.mode = mode
    const darkModeMediaQuery = window.matchMedia(MATCH_MEDIA_QUERY)
    const handleDarkModeChange = (event: MediaQueryListEvent): void => changeMode(event.matches)
    if (state.value.mode === CONFIG_PROVIDER_THEME.SYSTEM) {
      // 系统模式：监听系统主题变化
      darkModeMediaQuery.addEventListener('change', handleDarkModeChange)
      const isDarkMode = window.matchMedia(MATCH_MEDIA_QUERY).matches
      changeMode(isDarkMode)
    } else {
      // 手动模式：移除监听，直接应用选择的模式
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange)
      changeMode(state.value.mode === CONFIG_PROVIDER_THEME.DARK)
    }
  }

  /**
   * 高亮文本中的指定内容
   *
   * 使用警告色背景和加粗字体高亮匹配的文本
   *
   * @param text 原始文本
   * @param replace 要高亮的内容（支持正则表达式）
   * @returns 包含高亮 HTML 的字符串
   *
   * @example
   * highlightedText('Hello World', 'World')
   * // 返回: '<span>Hello <span style="background: ...">World</span></span>'
   */
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

  /**
   * 重置状态为初始值
   *
   * Pinia store 的标准重置方法
   *
   * @returns 重置后的状态
   */
  function $reset(): ConfigProviderState {
    const initialState = {
      algorithm: null,
      ...{locale: navigator.language},
      ...STORED_STATE_VALUE,
      ...{notificationConfig:{ placement: 'bottomRight',maxCount:6, showProgress: true, bottom: token.value.sizeXL}},
      ...(storedValue ? JSON.parse(storedValue) : {}),
    }

    // 初始化 screen 属性
    const initialScreen = calculateScreenBreakpoint(window.innerWidth)

    return {
      ...initialState,
      screen: initialScreen,
    }
  }

  /**
   * 窗口大小变化处理函数
   * 当窗口大小改变时，重新计算屏幕断点
   */
  const handleResize = (): void => {
    updateScreenBreakpoint()
  }

  /**
   * 设置首页侧边栏折叠宽度
   *
   * @param width 折叠宽度（像素）
   */
  function setHomeCollapsedWidth(width: number): void {
    state.value.homeCollapsedWidth = width
    saveLocalStorage()
  }

  function providerTheme() {
    const raw = getAlgorithm()
    const algorithm =
      raw == null ? undefined : Array.isArray(raw) ? raw.filter((item) => item != null) : raw
    return {algorithm, token: state.value.token}
  }

  /**
   * 组件挂载时的初始化
   *
   * 1. 添加窗口大小变化监听器
   * 2. 初始化屏幕断点值
   */
  onMounted(() => {
    window.addEventListener('resize', handleResize)
    // 初始化时更新一次，确保 screen 有正确的初始值
    updateScreenBreakpoint()
  })

  /**
   * 组件卸载时的清理
   *
   * 移除窗口大小变化监听器，防止内存泄漏
   */
  onUnmounted(() => window.removeEventListener('resize', handleResize))

  // 初始化：设置主题模式和语言环境
  setMode(state.value.mode)
  changeLocale(state.value.locale)

  return {
    /** 响应式状态对象 */
    state,
    /** 获取 Ant Design Vue theme token 的函数 */
    getToken,
    /** 获取 token 值 */
    getTokenValue,
    /** 设置 token 值 */
    setTokenValue,
    /**
     * 是否小于等于平台宽度
     */
    isPadScreen,
    /** 获取当前主题值 */
    getTheme,
    /** 设置首页侧边栏宽度 */
    setHomeSiderWidth,
    setCompact,
    setComponentSize,
    setCreateSuccessBack,
    /** 设置首页侧边栏折叠宽度 */
    setHomeCollapsedWidth,
    /** 设置首页侧边栏是否可折叠 */
    setHomeCollapsible,
    getAlgorithm,
    /** 当前语言环境的翻译消息 */
    localeMessage,
    /** 获取所有可用的语言环境列表 */
    getLocales,
    /** 切换语言环境 */
    changeLocale,
    /** 设置主题模式 */
    setMode,
    /** 高亮文本中的指定内容 */
    highlightedText,
    /** 重置状态为初始值 */
    $reset,
    providerTheme
  }
})
