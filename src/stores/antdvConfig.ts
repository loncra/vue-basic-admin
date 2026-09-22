/**
 * antdv 全局配置实例（pro 的 `createAntdvConfig`）。
 *
 * **pro 只持内存状态**：初值从哪来、怎么存回去、DOM / i18n 怎么同步，全是宿主的事
 * （一台机器 N 个用户 ⇒ pro 不该知道"按谁存"）。
 * 这里用 `@/stores` 之外的文件放实例（不是 pinia store）：模块级的 `utils/chatUtils.ts`
 * 也要读它（那里要程序化构造 `XProvider`）。
 */
import {watch} from 'vue'
import {createAntdvConfig, type AntdvConfigState} from '@loncra/antdv-pro'
import dayjs from 'dayjs'
import i18n, {type LanguagePack} from '@/i18n'

/** 沿用老的键：老版本的 JSON 里正好就有 `mode` / `token` / `componentSize` / `locale` / `formLayout` / `detailLayout` ⇒ 用户偏好直接带过来 */
const STORAGE_KEY = import.meta.env.VITE_APP_LOCAL_STORAGE_CONFIG_PROVIDER_NAME

function readStored(): Partial<AntdvConfigState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<AntdvConfigState>) : {}
  } catch {
    return {}
  }
}

/** 唯一那份配置实例（`LProvider` 收它，pro 内部 `useAntdvConfig()` 拿到的就是它） */
export const antdvConfig = createAntdvConfig(readStored())

/** 存回：`state` 全是"输入"，整份写 */
watch(
  antdvConfig.state,
  (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
  {deep: true},
)

/** `<html data-theme>`：启动骨架 / 依赖 CSS 变量的样式靠它适配明暗（pro 不碰 DOM） */
watch(
  antdvConfig.theme,
  (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
  },
  {immediate: true},
)

/** 语言：配置一改就同步 vue-i18n 与 dayjs（pro 不引 vue-i18n） */
watch(
  () => antdvConfig.state.locale,
  (locale) => {
    i18n.global.locale.value = locale
    const dayjsLocale = (i18n.global.messages.value as Record<string, LanguagePack>)[locale]?.dayjs
    if (typeof dayjsLocale === 'string') {
      dayjs.locale(dayjsLocale)
    }
  },
  {immediate: true},
)

/** antdv 的 locale 对象（喂 `LProvider :locale-message`）：由宿主的 i18n 决定，pro 不猜 */
export function antdvLocaleMessage(): object | undefined {
  const messages = i18n.global.messages.value as Record<string, LanguagePack>
  return messages[antdvConfig.state.locale]?.antDesign as object | undefined
}
