import {inject} from 'vue'
import {useRoute, useRouter, type RouteLocationRaw} from 'vue-router'
import type {CrudStaleInfo} from '@loncra/antdv-pro'
import {LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY} from '@/constants'

/**
 * 离场去处。
 *
 * ⚠️ **字符串一律当"路由名"**：`CrudPageCore.routes` 那一族就是名字（`MODEL_SETTING_ROUTE.HOME`
 * = `'ai_server_model_setting'`，pro 自己也是 `{name: page.routes?.[kind]}` 这么用的）。
 * 别把字符串直接交给 `router.push` —— vue-router 会把它当**路径**解析（去找
 * `/ai_server_mcp_package`，没有这条路由 ⇒ 跳不走 + 控制台警告）。
 * 2026-09-29 用户发现：当时 20+ 个壳都写的是 `redirect: xCore.routes?.home` ⇒ 全都跳不动。
 */
export type PageExitRedirect = RouteLocationRaw | string | (() => RouteLocationRaw | string)

/**
 * 表单 / 详情页的**离场策略**（宿主环境）。
 *
 * 旧 `BasicForm` / `BasicDetail` 自己就能关 tab、回列表；搬到 pro 之后壳里不做这些，于是回到宿主：
 * - `backToList()`：回列表 + 关掉当前 tab（保存成功后的编辑态、记录被删之后都用它）；
 * - `onStale(info)`：直接接在壳的 `@stale` 上 —— **记录被删**才回列表；
 *   "被别处改过"的处理（覆盖 / 二选一）pro 在那个事件之前已经做完了，宿主不用管。
 *
 * `redirect` 可以给**函数**：去处依赖"提交/离场那一刻"的数据时用它（如字典数据回列表要带上实体
 * 的 `typeId`，而它在取数之后才知道）—— 函数在原 `router.push` 的位置才求值。
 */
export function usePageExit(options: {
  redirect?: PageExitRedirect
}) {
  const router = useRouter()
  const route = useRoute()
  const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
    LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  )

  function backToList(): void {
    const {redirect} = options
    if (redirect) {
      const target = typeof redirect === 'function' ? redirect() : redirect
      // 字符串 = 路由名 ⇒ 包成 `{name}`（直接 push 字符串会被当 path ✗）
      router.push(typeof target === 'string' ? {name: target} : target)
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
