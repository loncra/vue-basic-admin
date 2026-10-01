/**
 * 宿主的**配置**（就这一处）：
 * - **antdv 那半**：pro 的配置实例（`createAntdvConfig`）—— 主题模式 / 语言 / 组件尺寸 /
 *   token 覆盖 / formLayout / detailLayout。pro 只持内存状态（一台机器 N 个用户 ⇒ pro 不知道
 *   "按谁存"），初值读取、写回、`<html data-theme>`、i18n / dayjs 同步都是这里的宿主接线；
 * - **布局偏好**：首页侧边栏宽度 / 折叠宽度 / 可折叠 / 屏幕断点；
 * - **业务偏好**：创建成功后的去向、message / notification 配置。
 *
 * 前两半原来分在 `@/stores/antdvConfig` + 本文件两个文件里，2026-09-22 收紧到一处：
 * 它们都是"应用级、per-user 的配置"、都由 `App.vue` 引导，激活时机一致（首次 `useStore()`）。
 *
 * ⚠️ 取"**算好的 token 表**"走 `getToken()`（内部就是 antdv 的 `theme.useToken()`，由
 * `<l-provider :theme="antdv.themeConfig">` 驱动）；`antdv.state.token` 只是**用户改过的
 * 覆盖项**（`AntdvTokenOverrides`，标量白名单），别当 token 表用。
 */
import {computed, type ComputedRef, markRaw, onMounted, onUnmounted, ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {theme} from 'antdv-next'
import {createAntdvConfig} from '@loncra/antdv-pro'
import dayjs from 'dayjs'
import i18n, {proLocaleOf, type LanguagePack} from '@/i18n'
import {type CreateSuccessBackValue, PAD_SCREENS, SCREEN_BREAKPOINT, STORE,} from '@/constants'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {ConfigOptions} from 'antdv-next/dist/message/interface'
import type {GlobalConfigProps} from 'antdv-next/dist/notification/interface'
import type {ConfigProviderState, ConfigProviderStoredState} from '@/types/composables'

/**
 * **唯一一份**配置存储（`.env` 的 `VITE_APP_LOCAL_STORAGE_CONFIG_PROVIDER_NAME`）。
 *
 * ⚠️ **只允许一个写入者**（就是下面那个持久化 `watch`）：历史上这里是两个 writer ——
 * 一个整份写 `antdv.state`，另一个（`saveLocalStorage()`）**只写宿主的窄集合**，
 * 且它在 store 初始化时也会跑一次 ⇒ **刷新时把 pro 的字段（`mode` / `componentSize` /
 * `formLayout` / `detailLayout` / `locale` / `token` / `compact`）整份覆盖掉**，
 * 表现为"设置刷新就丢"（2026-10-01 查明；`saveLocalStorage()` 已删除）。
 */
const STORAGE_KEY = import.meta.env.VITE_APP_LOCAL_STORAGE_CONFIG_PROVIDER_NAME

/**
 * 宿主要持久化的**自有**字段（= 原先那个窄写入者保存的 6 项；`screen` 是运行期派生值 ⇒ 不存）
 * 在下面唯一写入者里**显式列出**。
 */

const DEFAULTS: ConfigProviderStoredState = {
  homeSiderWidth: 260,
  homeCollapsedWidth: 84,
  homeCollapsible: false,
  createSuccessBack: undefined,
  messageConfig: {maxCount: 1} as ConfigOptions,
  notificationConfig: {placement: 'bottomRight', maxCount: 6, showProgress: true} as GlobalConfigProps,
}


/** 读那份配置 —— pro 字段与宿主字段**在同一份 JSON 里**（见 `ConfigProviderStoredState`） */
function readStored(): Partial<ConfigProviderStoredState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<ConfigProviderStoredState>) : {}
  } catch {
    return {}
  }
}

export const useConfigProviderStore = defineStore(STORE.CONFIG_PROVIDER_ID, () => {
  // #region antdv 配置实例（pro 的 `AntdvConfig`）+ 宿主接线

  /**
   * 唯一那份配置实例（`App.vue` 喂给 `LProvider`，pro 内部 `useAntdvConfig()` 拿到的就是它）。
   *
   * ⚠️ `markRaw` 不能省：pinia 会把 store 里的对象**深度 reactive 化**，那会把 `theme` /
   * `themeConfig` 这两个 computed **解包掉**（类型也不再是 `AntdvConfig`）⇒ `LProvider` 与
   * pro 的 `useAntdvConfig()` 都取不到 ref。实例内部的 `state` 本来就是 reactive，
   * 所以读 `store.antdv.state.x` 一样响应式；`theme` / `themeConfig` 要写 `.value`。
   */
  const antdv = markRaw(createAntdvConfig(readStored()))

  /*
   * 持久化**不在这里**：唯一写入者要同时写 pro 的 `antdv.state` 与宿主的 `state`
   * ⇒ 必须等 `state` 建好之后再注册（见 `const state = ref<ConfigProviderState>(…)` 之后那段）。
   */

  // `<html data-theme>`：启动骨架 / 依赖 CSS 变量的样式靠它适配明暗（pro 不碰 DOM）
  watch(
    antdv.theme,
    (resolved) => {
      document.documentElement.setAttribute('data-theme', resolved)
    },
    {immediate: true},
  )

  // 语言：配置一改就同步 vue-i18n 与 dayjs（pro 不引 vue-i18n）
  watch(
    () => antdv.state.locale,
    (locale) => {
      i18n.global.locale.value = locale
      const dayjsLocale = (i18n.global.messages.value as Record<string, LanguagePack>)[locale]?.dayjs
      if (typeof dayjsLocale === 'string') {
        dayjs.locale(dayjsLocale)
      }
    },
    {immediate: true},
  )

  /**
   * `LProvider :locale-message` 的内容 = **pro 语言包 + antd 语言包**（都按当前语言）。
   *
   * ⚠️ **只给 antd 的包是不够的**：pro 组件的内部文案走 `useLocale('X')`，它是拿「XProvider 的
   * `locale`」里的**同名段**去覆盖 pro 自己的 zh 兜底包（`@loncra/antdv/src/_util/useLocale.ts`）
   * ⇒ 宿主若只喂 antd 的包（里面只有 `Select` / `Table` / `DatePicker`… ✗，没有 `Crud` / `FileEditor`
   * / `AttachmentUpload` / `UserSelect` / `SystemUserPanel` / `ConfigProviderSetting` ✗）⇒ **永远回落中文**
   * ⇒ 切英文时列表工具条（搜索 / 重置 / 新增…）/ 设置面板 / 文件编辑器仍是中文 ✗（2026-09-29 查明）。
   * antd 在后 = 同名段 antd 优先 ✓。
   */
  function antdvLocaleMessage(): object | undefined {
    const messages = i18n.global.messages.value as Record<string, LanguagePack>
    const antDesign = messages[antdv.state.locale]?.antDesign as object | undefined
    return {...proLocaleOf(antdv.state.locale), ...antDesign}
  }

  // #endregion

  // Ant Design 的 token：**视图值**（间距、尺寸），不是状态 —— 页面用它算 spacing/尺寸
  const {useToken} = theme
  const {token} = useToken()

  const state = ref<ConfigProviderState>($reset())

  /**
   * 持久化：**唯一写入者** —— 整份写（pro 的 `antdv.state` + 下面那几个宿主自有字段）。
   *
   * ⚠️ **不要再加第二个写入者**（特别是"只写一部分字段"的那种）：整份 `setItem` 会把别人写进去的字段
   * 覆盖掉 —— 2026-10-01 "设置刷新就丢"就是历史上的窄集合写入者 `saveLocalStorage()` 干的（已删除）。
   * 同理：改这里的字段清单就够，别在别处再写一次 `localStorage.setItem(STORAGE_KEY, …)`。
   */
  watch(
    [antdv.state, state],
    () => {
      // `state.value` 是**深层解包**过的类型：直接拿它去标注/赋值会触发 TS 的深度实例化限制
      // （`TS2589` + `appContext` 不兼容，实测）⇒ 先按"要存的形状"取一次（原 `saveLocalStorage()` 同款手法）。
      const current = state.value as ConfigProviderStoredState
      const hostStored: ConfigProviderStoredState = {
        homeSiderWidth: current.homeSiderWidth,
        homeCollapsedWidth: current.homeCollapsedWidth,
        homeCollapsible: current.homeCollapsible,
        createSuccessBack: current.createSuccessBack,
        messageConfig: current.messageConfig,
        notificationConfig: current.notificationConfig,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({...antdv.state, ...hostStored}))
    },
    {deep: true},
  )

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

  // ⚠️ setter 只管改 `state`（**不再手动存**）：上面那个持久化 `watch` 是唯一写入者，会自动存。

  function setHomeSiderWidth(width: number): void {
    state.value.homeSiderWidth = width
  }

  function setHomeCollapsedWidth(width: number): void {
    state.value.homeCollapsedWidth = width
  }

  function setHomeCollapsible(collapsible: boolean): void {
    state.value.homeCollapsible = collapsible
  }

  function setCreateSuccessBack(value: CreateSuccessBackValue): void {
    state.value.createSuccessBack = value
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

  /*
   * `saveLocalStorage()` 已**删除**（2026-10-01）：它是"第二个写入者"，只写宿主那 6 个字段、
   * 且在初始化时也会执行一次 ⇒ 把 pro 的 `mode` / `componentSize` / `formLayout` … 整份覆盖掉
   * ⇒ 表现为"设置刷新就丢"。现在只有一个写入者（上面那个 `watch`，整份写）。
   */

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

  /*
   * 这里**不再**在初始化时主动写一次存储（2026-10-01）：那句话原本是窄集合写入者 `saveLocalStorage()`
   * 的调用点，正是"刷新就把 pro 字段覆盖掉"的直接原因。现在写入只发生在状态真变化时（上面的 `watch`）。
   */

  return {
    /** antdv 配置实例：喂 `LProvider :antdv-config`；宿主里读它的 `state` / `theme` / `themeConfig` */
    antdv,
    /** antdv 的 locale 对象（喂 `LProvider :locale-message`；宿主的 i18n 决定） */
    antdvLocaleMessage,
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
