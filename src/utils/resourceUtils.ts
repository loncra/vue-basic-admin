// 导入 Ant Design Vue Next 组件和图标（antdv-next 无 List 组件，Chat.vue 中已用 div 替代）
import {h, resolveComponent} from 'vue'
import type {IconfontJson} from '@/types/composables'


export function createIcon(type: string, classes: string = '', spin = false, rotate = 0) {
  return h(resolveComponent('IconFont'), {type, class: 'icon ' + classes, spin, rotate})
}

/**
 * 动态加载 CSS 文件
 * 如果 CSS 文件已存在（通过 ID 判断），则直接返回现有元素；否则创建新的 link 标签并加载
 *
 * @param id - CSS 文件的唯一标识符，用于检查是否已加载
 * @param href - CSS 文件的 URL 地址
 * @returns Promise 对象，成功时返回 HTMLLinkElement，失败时 reject
 *
 * @example
 * ```typescript
 * loadCss('my-style', '/path/to/style.css')
 *   .then(link => console.log('CSS 加载成功', link))
 *   .catch(err => console.error('CSS 加载失败', err))
 * ```
 */
export function loadCss(id: string, href: string): Promise<HTMLLinkElement> {
  const doLoad = function (
    resolve: (value: HTMLLinkElement) => void,
    reject: (reason?: unknown) => void,
  ) {
    // 检查是否已经存在相同 ID 的 link 标签
    const query = document.querySelector(`link[id='${id}']`) as HTMLLinkElement | null
    if (query) {
      // 如果已存在，直接返回
      resolve(query)
      return
    }

    // 创建新的 link 标签
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = href
    // 设置加载成功和失败的回调
    link.onload = () => resolve(link)
    link.onerror = reject
    // 添加到页面 head 中开始加载
    document.head.appendChild(link)
  }

  return new Promise(doLoad)
}

/**
 * 动态加载 JavaScript 文件
 * 如果 JavaScript 文件已存在（通过 ID 判断），则直接返回现有元素；否则创建新的 script 标签并加载
 *
 * @param id - JavaScript 文件的唯一标识符，用于检查是否已加载
 * @param href - JavaScript 文件的 URL 地址
 * @returns Promise 对象，成功时返回 HTMLScriptElement，失败时 reject
 *
 * @example
 * ```typescript
 * loadJs('my-script', '/path/to/script.js')
 *   .then(script => console.log('JS 加载成功', script))
 *   .catch(err => console.error('JS 加载失败', err))
 * ```
 */
export function loadJs(id: string, href: string): Promise<HTMLScriptElement> {
  const doLoad = function (
    resolve: (value: HTMLScriptElement) => void,
    reject: (reason?: unknown) => void,
  ) {
    // 检查是否已经存在相同 ID 的 script 标签
    const query = document.querySelector(`script[id='${id}']`) as HTMLScriptElement | null
    if (query) {
      // 如果已存在，直接返回
      resolve(query)
      return
    }

    // 创建新的 script 标签
    const script = document.createElement('script')
    script.id = id
    script.type = 'text/javascript'
    script.src = href
    // 设置加载成功和失败的回调
    script.onload = () => resolve(script)
    script.onerror = reject
    // 添加到页面 head 中开始加载
    document.head.appendChild(script)
  }

  return new Promise(doLoad)
}

export async function loadIcon(href: string): Promise<IconfontJson> {
  const response = await fetch(href)
  return (await response.json()) as IconfontJson
}
