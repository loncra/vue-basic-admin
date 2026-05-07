/**
 * 国际化（i18n）配置
 * 负责初始化 vue-i18n，动态加载所有语言包，并配置默认语言
 */

import { createI18n } from 'vue-i18n'
import type { NameValueEnumMetadata } from '@/types'

/** 语言包接口：扩展名称-值对，包含 Ant Design 国际化配置 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Locale = Record<string, any>

/**
 * 语言包接口
 * 扩展了基础的名称-值对结构，包含回退语言标识和 Ant Design 的国际化配置
 */
export interface LanguagePack extends NameValueEnumMetadata<string> {
  /** 是否为回退语言（默认语言） */
  fallbackLocale: boolean
  /** Ant Design 组件的国际化配置 */
  antDesign: Locale
  [key: string]: unknown
}

/**
 * 动态加载所有语言包
 * 使用 Vite 的 glob 功能导入 locales 目录下的所有语言包文件
 *
 * @returns Promise 对象，成功时返回语言包映射对象
 */
const loadAllLocales = async (): Promise<Record<string, LanguagePack>> => {
  const messages: Record<string, LanguagePack> = {}
  // 使用 eager 模式立即加载所有语言包
  const modules = import.meta.glob('@/i18n/locales/*', {
    eager: true,
    import: 'default',
  }) as Record<string, LanguagePack>

  // 遍历所有模块并添加到消息对象中
  for (const path in modules) {
    const locale = modules[path]
    if (!locale) {
      continue
    }
    // 使用语言包的值作为键
    messages[locale.value] = locale
  }
  return messages
}

/**
 * 创建 i18n 实例
 * 使用 Composition API 模式（legacy: false）
 */
const i18n = createI18n({
  legacy: false,
})

// 动态加载所有语言包并合并到 i18n 实例中
const messages: Record<string, LanguagePack> = await loadAllLocales()

// 将加载到的所有语言包合并到 i18n 实例中
Object.keys(messages).forEach((m) => {
  const locale = messages[m]
  if (!locale) {
    return
  }
  // 设置语言包消息
  i18n.global.setLocaleMessage(m, locale)
  // 如果语言包标记为回退语言，设置为默认语言
  if (locale.fallbackLocale) {
    i18n.global.fallbackLocale.value = locale.value
  }
})

export default i18n
