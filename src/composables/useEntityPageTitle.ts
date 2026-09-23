import {inject, onActivated, watch} from 'vue'
import {useRoute} from 'vue-router'
import i18n from '@/i18n'
import {LAYOUT_PANE_TITLE_PROVIDE_KEY} from '@/constants'
import {getRouteTitle} from '@/routers'
import {useMenuPrincipalStore} from '@/stores/menuStore'

/**
 * 实体页的标题同步（表单 / 详情）—— **宿主策略**，不是 pro 的能力。
 *
 * 旧 kit 的 `titleText` 没有搬进 pro（"怎么写标题"是宿主的事），于是这三件事回到宿主：
 * ① 基标题（路由名 → `getRouteTitle`）；② 括号里那个实体名（页面给"后缀"，返回 `undefined` 就不拼）；
 * ③ 写面包屑末尾 + 写布局 pane 名。语言切换 / 路由变化 / 实体加载出来，都会重算。
 *
 * 用法（`suffix` 里读的实体是壳 `expose` 出来的响应式对象，加载完成后写值都能跟到）：
 * ```ts
 * useEntityPageTitle(() => (formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined))
 * ```
 *
 * @param suffix 括号里的名字；没加载出来 / 新增态返回 `undefined`
 */
export function useEntityPageTitle(suffix: () => string | undefined): void {
  const route = useRoute()
  const setPaneName = inject<(fullPath: string, name: string) => void>(LAYOUT_PANE_TITLE_PROVIDE_KEY)
  const menuPrincipalStore = useMenuPrincipalStore()

  /**
   * 这个页壳**自己**的路由身份，setup 时一次性捕获。
   *
   * ⚠️ 不能直接读响应式的 `route`：`<keep-alive>` 缓存下来的页壳在**别的路由上依然活着**，
   * 它内部的 watcher 会被全局 `route` 变化唤醒，于是把**自己**的标题写到**别人**的 pane / 面包屑上
   * （2026-09-23 现象：员工管理**列表** tab 被写成「员工管理 (5544)」，就是缓存的详情/编辑页壳干的）。
   * 捕获之后：既不监听全局路由，又加一道 `isCurrent()` 守卫 —— 副作用只在自己是当前路由时发生。
   */
  const ownFullPath = route.fullPath
  const ownRouteName = route.name

  /** 当前路由是不是"我"（缓存页壳被别人唤醒时用它挡住副作用） */
  function isCurrent(): boolean {
    return route.fullPath === ownFullPath
  }

  function sync(): void {
    if (!isCurrent()) {
      return
    }
    const base = getRouteTitle(ownRouteName)
    const name = suffix()
    const title = name ? `${base} (${name})` : base
    setPaneName?.(ownFullPath, title)
    // 面包屑末尾那节就是当前页：把它的名字换成算好的标题
    const breadcrumbs = [...menuPrincipalStore.state.currentBreadcrumbs]
    const last = breadcrumbs.at(-1)
    if (last) {
      last.name = title
      menuPrincipalStore.setCurrentBreadcrumbs(breadcrumbs)
    }
  }

  // 不监听 `route.fullPath`：本页自己的路由变了会走"新 key 重建页壳"（见 `LayoutContent` 的
  // `getRouteCacheKey`），setup 会重跑，标题自然跟着重算。
  watch([() => i18n.global.locale.value, suffix], sync, {
    immediate: true,
    deep: true,
  })
  // 从缓存里被激活回来时补算一次（例如上次离开时实体还没加载出来，那时算不出括号里的名字）
  onActivated(sync)
}
