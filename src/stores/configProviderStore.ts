import {computed, type ComputedRef, markRaw, onMounted, onUnmounted, ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {theme} from 'antdv-next'
import {createAntdvConfig} from '@loncra/antdv-pro'
import dayjs from 'dayjs'
import i18n, {type LanguagePack, proLocaleOf} from '@/i18n'
import {type CreateSuccessBackValue, PAD_SCREENS, SCREEN_BREAKPOINT, STORE,} from '@/constants'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {ConfigOptions} from 'antdv-next/dist/message/interface'
import type {GlobalConfigProps} from 'antdv-next/dist/notification/interface'
import type {ConfigProviderState, ConfigProviderStoredState} from '@/types/composables'

const LEGACY_KEY = import.meta.env.VITE_APP_LOCAL_STORAGE_CONFIG_PROVIDER_NAME

const DEFAULTS: ConfigProviderStoredState = {
  homeSiderWidth: 260,
  homeCollapsedWidth: 84,
  homeCollapsible: false,
  createSuccessBack: undefined,
  messageConfig: {maxCount: 1} as ConfigOptions,
  notificationConfig: {placement: 'bottomRight', maxCount: 6, showProgress: true} as GlobalConfigProps,
}


function readStored(): Partial<ConfigProviderStoredState> {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    return raw ? (JSON.parse(raw) as Partial<ConfigProviderStoredState>) : {}
  } catch {
    return {}
  }
}

export const useConfigProviderStore = defineStore(STORE.CONFIG_PROVIDER_ID, () => {

  const antdv = markRaw(createAntdvConfig(readStored()))

  watch(
    antdv.state,
    (state) => {
      localStorage.setItem(LEGACY_KEY, JSON.stringify(state))
    },
    {deep: true},
  )

  watch(
    antdv.theme,
    (resolved) => {
      document.documentElement.setAttribute('data-theme', resolved)
    },
    {immediate: true},
  )

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

  function antdvLocaleMessage(): object | undefined {
    const messages = i18n.global.messages.value as Record<string, LanguagePack>
    const antDesign = messages[antdv.state.locale]?.antDesign as object | undefined
    return {...proLocaleOf(antdv.state.locale), ...antDesign}
  }


  const {useToken} = theme
  const {token} = useToken()

  const state = ref<ConfigProviderState>($reset())

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
    const current = state.value as ConfigProviderStoredState
    const storedValue: ConfigProviderStoredState = {
      homeSiderWidth: current.homeSiderWidth,
      homeCollapsedWidth: current.homeCollapsedWidth,
      homeCollapsible: current.homeCollapsible,
      createSuccessBack: current.createSuccessBack,
      messageConfig: current.messageConfig,
      notificationConfig: current.notificationConfig,
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(storedValue))
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

  saveLocalStorage()

  return {
    antdv,
    antdvLocaleMessage,
    state,
    getToken,
    isPadScreen,
    setHomeSiderWidth,
    setHomeCollapsedWidth,
    setHomeCollapsible,
    setCreateSuccessBack,
    highlightedText,
    $reset,
  }
})
