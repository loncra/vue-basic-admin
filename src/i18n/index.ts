
import {createI18n} from 'vue-i18n'
import {enUS as proEnUS, zhCN as proZhCN} from '@loncra/antdv-pro'
import type {NameValueEnumMetadata} from '@loncra/client/commons'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Locale = Record<string, any>

export interface LanguagePack extends NameValueEnumMetadata<string> {
  fallbackLocale: boolean
  antDesign: Locale

  [key: string]: unknown
}

const loadAllLocales = async (): Promise<Record<string, LanguagePack>> => {
  const messages: Record<string, LanguagePack> = {}
  const modules = import.meta.glob('@/i18n/locales/*', {
    eager: true,
    import: 'default',
  }) as Record<string, LanguagePack>

  for (const path in modules) {
    const locale = modules[path]
    if (!locale) {
      continue
    }
    messages[locale.value] = locale
  }
  return messages
}

const proLocales: Record<string, Locale> = {
  'zh-CN': proZhCN as unknown as Locale,
  'en-US': proEnUS as unknown as Locale,
}

export function proLocaleOf(locale: string | undefined): Locale {
  return (locale ? proLocales[locale] : undefined) ?? {}
}

const i18n = createI18n({
  legacy: false,
})

const messages: Record<string, LanguagePack> = await loadAllLocales()

Object.keys(messages).forEach((m) => {
  const locale = messages[m]
  if (!locale) {
    return
  }
  i18n.global.setLocaleMessage(m, {...(proLocales[m] ?? {}), ...locale})
  if (locale.fallbackLocale) {
    i18n.global.fallbackLocale.value = locale.value
  }
})

export default i18n
