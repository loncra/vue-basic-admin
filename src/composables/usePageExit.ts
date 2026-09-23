import {inject} from 'vue'
import {useRoute, useRouter, type RouteLocationRaw} from 'vue-router'
import type {CrudStaleInfo} from '@loncra/antdv-pro'
import {LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY} from '@/constants'

/**
 * 表单 / 详情页的**离场策略**（宿主环境）。
 *
 * 旧 `BasicForm` / `BasicDetail` 自己就能关 tab、回列表；搬到 pro 之后壳里不做这些，于是回到宿主：
 * - `backToList()`：回列表 + 关掉当前 tab（保存成功后的编辑态、记录被删之后都用它）；
 * - `onStale(info)`：直接接在壳的 `@stale` 上 —— **记录被删**才回列表；
 *   "被别处改过"的处理（覆盖 / 二选一）pro 在那个事件之前已经做完了，宿主不用管。
 */
export function usePageExit(options: {redirect?: RouteLocationRaw}) {
  const router = useRouter()
  const route = useRoute()
  const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
    LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  )

  function backToList(): void {
    if (options.redirect) {
      router.push(options.redirect)
    }
    closeLayoutTab?.(route.fullPath, false)
  }

  function onStale(info: CrudStaleInfo): void {
    if (info.reason === 'deleted') {
      backToList()
    }
  }

  return {backToList, onStale}
}
