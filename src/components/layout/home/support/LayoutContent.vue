<script setup lang="ts">
import {renderIconFont} from '@/utils/commonUtils'

import {type RouteLocationNormalized, type RouteLocationNormalizedLoaded} from 'vue-router'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch
} from 'vue'
import type {MenuItemType} from 'antdv-next'
import {requireNonNullOrUndefined} from '@/utils'
import {
  APP_RELOAD_PROVIDE_KEY,
  LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  LAYOUT_PANE_TITLE_PROVIDE_KEY
} from '@/constants'
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import type {RouteResourceMetadata} from '@/types/apis'
import i18n from "@/i18n";
import {getRouteTitle} from '@/routers'
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import LLayoutFooter from "@/components/layout/LayoutFooter.vue";

defineOptions({
  name: 'LLayoutContent',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const menuPrincipalStore = useMenuPrincipalStore()
const messageServerStore = useMessageServerStore()

const activeKey = ref<string>('')
const isRouterAlive = ref(true)
const isFullscreen = ref(false)
const isFullscreenExiting = ref(false)
const routeCacheVersions = ref<Record<string, number>>({})
const panes = ref<RouteResourceMetadata[]>([])

/** 用户手动固定的标签页（路由 name 集合），持久化到 localStorage */
const pinnedRouteNames = ref<RouteResourceMetadata[]>([])
const fixedRouteNames = ref<Set<string>>(new Set())

const operateItems = ref<MenuItemType[]>([
  {
    key: 'close-others',
    label: globalProperties.$t('layoutContent.close.others'),
    icon: () => renderIconFont('loncra-copy-x'),
  },
  {
    key: 'close-right',
    label: globalProperties.$t('layoutContent.close.right'),
    icon: () => renderIconFont('loncra-list-x'),
  },
])

/** 每次打开右键菜单要先剔掉这两项（pin/unpin 按当前标签状态再插入）；单独列出，避免在回调里推断大联合类型 */
const HIDDEN_OPERATE_KEYS: string[] = ['unpin', 'pin']

provide(APP_RELOAD_PROVIDE_KEY, reload)
provide(LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY, removePaneByPage)
provide(LAYOUT_PANE_TITLE_PROVIDE_KEY, setPaneName)

function isRoutePageLoading(itemKey: string | number): boolean {
  const p = menuPrincipalStore.state.routeEnterPage
  return Boolean(p?.loading && String(itemKey) === p.fullPath)
}

function setPaneName(fullPath: string, name: string) {
  const pane = panes.value.find((p) => p.path === fullPath)
  if (!pane) {
    return
  }
  pane.name = name
}

function getFixedRoutesFromRouter(): RouteResourceMetadata[] {
  const homeRoute = globalProperties.$router.getRoutes().find((r) => r.name === import.meta.env.VITE_APP_HOME_PAGE_NAME)
  if (!homeRoute?.children?.length) {
    return []
  }
  const fixed = homeRoute.children
    .filter((r) => r.name && (r.meta?.fixed as boolean))
    .sort((a, b) => ((a.meta?.sort as number) ?? 0) - ((b.meta?.sort as number) ?? 0))
  return fixed
    .map((r) => globalProperties.$router.resolve({name: r.name as string}))
    .filter((loc) => loc.name)
    .map((loc) => menuPrincipalStore.toResourceRouteMetadata(loc as RouteLocationNormalizedLoaded))
}

function loadPinnedFromStorage(): RouteResourceMetadata[] {
  try {
    const raw = localStorage.getItem(import.meta.env.VITE_APP_LOCAL_STORAGE_FIXED_TABS_NAME)
    return raw ? (JSON.parse(raw) as RouteResourceMetadata[]) : []
  } catch {
    return []
  }
}

function getActiveRoute(route: RouteResourceMetadata) {
  let temp = route;
  if (route.parentKeepAlive) {
    const parent = globalProperties.$router
      .getRoutes()
      .find(r => [r.path, r.name].includes(String(route.parentKeepAlive)))
    if (parent) {
      const newRoute:RouteLocationNormalized = {
        ...parent,
        fullPath: route.path,
        matched: [],
        query: {},
        hash: "",
        redirectedFrom: undefined,
        params: {}
      }
      temp = menuPrincipalStore.toResourceRouteMetadata(newRoute)
    }
  }

  return temp;
}

function activateTab(route: RouteResourceMetadata) {
  const temp = getActiveRoute(route)

  panes.value = panes.value.filter(p => !p.deactivatedClose)
  let current = panes.value.find(p => p.path === temp.path)
  if (!current && route.parentKeepAlive) {
    current = panes.value.find(p => p.page === route.parentKeepAlive)
  }

  if (!current) {
    panes.value.push(temp);
  } else {
    if (route.parentKeepAlive) {
      current.path = String(route.path)
    } else if (globalProperties.$route.fullPath !== current.path) {
      // 已在目标路径上就别再 push 一次：同址导航虽然会被 vue-router 静默吞掉，
      // 但一次点击走两遍导航流程（含两遍过渡判定）纯属浪费 —— 排查页签缓存问题时顺手加的守卫
      globalProperties.$router.push(current.path)
    }
  }
  activeKey.value = temp.path as string
  if (temp.single) {
    const keepPath = temp.path
    const pageKey = temp.page
    const toRemove = panes.value.filter(
      (p) => p.page === pageKey && p.path !== keepPath && !isPaneFixed(p),
    )
    toRemove.forEach(incrementRouteCacheVersions)
    panes.value = panes.value.filter(
      (p) => !(p.page === pageKey && p.path !== keepPath) || isPaneFixed(p),
    )
  }
}

function getRouteCacheKey(route: RouteLocationNormalizedLoaded): string {
  const key = getRouteCachePrefix(route);
  const version = getRouteCacheValue(route)
  return String(`${key}-v${version}`)
}

function getRouteCachePrefix(route: RouteLocationNormalizedLoaded | RouteResourceMetadata) {
  if ((route as RouteLocationNormalizedLoaded).meta) {
    const loaded = (route as RouteLocationNormalizedLoaded)
    return String(loaded?.meta?.parentKeepAlive || loaded.fullPath);
  } else {
    const loaded = (route as RouteResourceMetadata)
    return String(loaded.parentKeepAlive || loaded.page);
  }
}

function getRouteCacheValue(route: RouteLocationNormalizedLoaded | RouteResourceMetadata) {
  const key = getRouteCachePrefix(route);
  return routeCacheVersions.value[key] || 0
}

function incrementRouteCacheVersions(route:RouteLocationNormalizedLoaded | RouteResourceMetadata) {
  const key = getRouteCachePrefix(route)
  const v = getRouteCacheValue(route)
  routeCacheVersions.value[key] = v + 1
}

function changeTab(value: string | number) {
  const current = panes.value.find(p => p.path === value)
  if (!current) {
    return
  }
  activateTab(current)

  panes.value = panes.value.filter(p => !p.deactivatedClose)
}

function mounted(): void {
  const route = globalProperties.$route
  const fixedRoutes = getFixedRoutesFromRouter()
  pinnedRouteNames.value = loadPinnedFromStorage()
  const initialPanes: RouteResourceMetadata[] = []
  for (const r of fixedRoutes) {
    const name = r.path as string
    if (fixedRouteNames.value.has(name)) {
      continue;
    }
    fixedRouteNames.value.add(name)
  }

  for (const r of [...fixedRoutes, ...pinnedRouteNames.value]) {
    initialPanes.push(r)
  }

  initialPanes.map(r => panes.value.push(r))
  activateTab(menuPrincipalStore.toResourceRouteMetadata(route))
  if (!(route.fullPath in routeCacheVersions.value)) {
    routeCacheVersions.value[route.fullPath] = 0
  }
}

function removePaneByPage(page: string, activatePane:boolean = true): void {
  const pane = panes.value.find((p) => p.path === page)
  if (!pane) {
    return
  }
  const index = panes.value.findIndex((p) => p.path === page)
  const targetRoute = panes.value[index]
  if (targetRoute) {
    incrementRouteCacheVersions(targetRoute)
  }
  panes.value = panes.value.filter((p) => p.path !== page)
  if (!activatePane) {
    return
  }
  const change = panes.value[index - 1]
  if (change) {
    activateTab(change)
  }
}

function reload() {
  isRouterAlive.value = false
  nextTick(() => (isRouterAlive.value = true))
}

function exitFullscreen() {
  if (!isFullscreen.value || isFullscreenExiting.value) {
    return
  }
  isFullscreenExiting.value = true
}

function onFullscreenAnimationEnd(e: AnimationEvent) {
  if (e.target !== e.currentTarget) {
    return
  }
  if (isFullscreenExiting.value && e.animationName === 'layout-content-fullscreen-out') {
    isFullscreen.value = false
    isFullscreenExiting.value = false
  }
}

function toggleFullscreen() {
  if (isFullscreenExiting.value) {
    return
  }
  if (isFullscreen.value) {
    exitFullscreen()
  } else {
    isFullscreen.value = true
  }
}

/** 判断标签页是否为固定（路由 meta.fixed 或用户手动固定） */
function isPaneFixed(pane: RouteResourceMetadata): boolean {
  return pane.fixed || pinnedRouteNames.value.some(p => p.path === pane.path)
}

function savePinnedToStorage() {
  localStorage.setItem(
    import.meta.env.VITE_APP_LOCAL_STORAGE_FIXED_TABS_NAME,
    JSON.stringify([...pinnedRouteNames.value]),
  )
}

/** 取消固定 */
function onUnpin() {
  pinnedRouteNames.value = pinnedRouteNames.value.filter(p => p.path !== activeKey.value)
  savePinnedToStorage()
}

/** 固定当前标签页 */
function onPin() {
  if (pinnedRouteNames.value.some(p => p.path === activeKey.value)) {
    return
  }
  const route = panes.value.find(p => p.path === activeKey.value)
  if (!route) {
    return
  }
  pinnedRouteNames.value.push(route)
  savePinnedToStorage()
}

/** 关闭其他标签页：保留当前标签页和所有 fixed 标签页 */
function onCloseOthers() {
  const toRemove = panes.value.filter((p) => p.path !== activeKey.value && !isPaneFixed(p))
  toRemove.forEach((p) => incrementRouteCacheVersions(p))
  const removedPages = toRemove.map(p => p.path);
  panes.value = panes.value.filter(p => !removedPages.includes(p.path))
}

/** 关闭右侧标签页 */
function onCloseRight() {
  //const currentRoute = globalProperties.$route
  const idx = panes.value.findIndex((p) => p.path === activeKey.value)
  if (idx < 0) {
    return
  }
  const toRemove = panes.value.slice(idx + 1).filter((p) => !isPaneFixed(p))
  toRemove.forEach(incrementRouteCacheVersions)
  panes.value = panes.value.filter((p, i) => i <= idx || isPaneFixed(p))
}

function onOperateMenuClick(e: { key: string }) {
  if (e.key === 'pin') {
    onPin()
  } else if (e.key === 'unpin') {
    onUnpin()
  } else if (e.key === 'close-others') {
    onCloseOthers()
  } else if (e.key === 'close-right') {
    onCloseRight()
  }
}

function onOpenOperateChange(open: boolean) {
  if (!open) {
    return
  }
  // 显式标注回调参数 + key 列表提到外面：不让 TS 去**推断** MenuItemType（深度递归的大联合），
  // 否则会触发 "Type instantiation is excessively deep and possibly infinite"（TS2589）。
  operateItems.value = operateItems.value.filter(
    (item: MenuItemType) => item?.key != null && !HIDDEN_OPERATE_KEYS.includes(String(item.key)),
  )
  if (fixedRouteNames.value.has(activeKey.value)) {
    return
  }
  if (pinnedRouteNames.value.some(p => p.path === activeKey.value)) {
    operateItems.value.unshift({
      key: 'unpin',
      label: globalProperties.$t('layoutContent.unpin'),
      icon: () => renderIconFont('loncra-pin-off'),
    })
  } else {
    operateItems.value.unshift({
      key: 'pin',
      label: globalProperties.$t('layoutContent.pin'),
      icon: () => renderIconFont('loncra-pin'),
    })
  }
}

function onRemoveTab(value: string, action: string) {
  if (action !== 'remove') {
    return
  }
  const pane = panes.value.find((p) => p.path === value)
  if (!pane || isPaneFixed(pane)) {
    return
  }
  const index = panes.value.findIndex((p) => p.path === value)
  const targetRoute = panes.value[index]
  if (targetRoute) {
    incrementRouteCacheVersions(targetRoute)
  }
  const change = panes.value[index - 1]
  if (change && activeKey.value === value) {
    activateTab(change)
  }
  panes.value = panes.value.filter((p) => p.path !== value)
}

watch(
  () => globalProperties.$route.fullPath,
  () => activateTab(menuPrincipalStore.toResourceRouteMetadata(globalProperties.$route)),
)

watch(
  () => i18n.global.locale.value,
  () => panes.value.forEach((p) =>  {
    if (p.dynamicTitle) {
      return
    }
    p.name = getRouteTitle(p.route)
  })
)

onMounted(mounted)

onUnmounted(() => routeCacheVersions.value = {})
</script>

<template>
  <a-layout-content
    class="h-full overflow-hidden"
  >
    <a-flex
      vertical
      :class="[
        'h-full overflow-auto',
        isFullscreen && 'layout-content-fullscreen',
        isFullscreenExiting && 'layout-content-fullscreen-exit',
      ]"
      @animationend="onFullscreenAnimationEnd"
    >
      <!-- 顶部操作区：左侧预留按钮，右侧分段器充当标签导航 -->
      <a-flex align="center" justify="center" class="layout-content-operation">
        <div class="tool-bar " >
          <a-tabs
            @change="changeTab"
            :items="panes.map(p => ({badge:p.badge, route:p.route, label: p.name, iconString: p.icon, key: p.path, closable: !pinnedRouteNames.some(_p => _p.path === p.path) && !fixedRouteNames.has(p.path) }))"
            type="editable-card"
            :active-key="activeKey"
            hide-add
            @edit="onRemoveTab"
          >
            <template #labelRender="{ item }">
                <a-space>
                  <icon-font
                    v-if="isRoutePageLoading(item.key)"
                    class="icon align"
                    type="loncra-loader"
                    spin
                  />
                  <icon-font
                    v-else
                    class="icon align"
                    :type="item.iconString || 'loncra-file'"
                  />
                  <a-badge :key="item.label" dot :count="messageServerStore.getUnreadQuantityByType(item.route)">
                    <span>{{item.label}}</span>
                  </a-badge>
                </a-space>
            </template>
            <template #leftExtra>
              <div class="mr-xs">
                <a-tooltip :title="globalProperties.$t('common.refresh')">
                  <a-button type="text" @click="reload">
                    <template #icon>
                      <icon-font class="icon align" type="loncra-refresh-cw"/>
                    </template>
                  </a-button>
                </a-tooltip>
                <a-tooltip
                  :title="
                    isFullscreen
                      ? globalProperties.$t('layoutContent.exitFullscreen')
                      : globalProperties.$t('layoutContent.fullscreen')
                  "
                >
                  <a-button type="text" @click="toggleFullscreen">
                    <template #icon>
                      <icon-font
                        class="icon align"
                        :type="isFullscreen ? 'loncra-minimize' : 'loncra-expand'"
                      />
                    </template>
                  </a-button>
                </a-tooltip>
                <a-dropdown
                  :menu="{ items: operateItems }"
                  @menu-click="onOperateMenuClick"
                  @open-change="onOpenOperateChange"
                >
                  <a-button type="text">
                    <template #icon>
                      <icon-font class="icon align" type="loncra-ellipsis"/>
                    </template>
                  </a-button>
                </a-dropdown>
              </div>
            </template>
          </a-tabs>
        </div>
      </a-flex>
      <!--
        `min-h-0` 不能省：`flex="1"` 这层是 flex item，默认 `min-height: auto` ⇒ 内层很高的
        内容（卡片 body 的最小高 / 很长的列表）会把它**顶高**而不是被压缩 ⇒ 内容区比可视区高、
        整页溢出（2026-09-30 实测：可视 334px 里塞了 537px 的内容）。仓里其它地方都是
        `h-full min-h-0` 成对出现，这里就是漏了。
      -->
      <a-flex vertical flex="1" class="pr-md pl-md">
        <a-spin
          class="size-full-spin"
          :spinning="isRoutePageLoading(globalProperties.$route.fullPath)"
          :description="globalProperties.$t('layoutContent.loading')"
        >
          <router-view v-if="isRouterAlive" v-slot="{ Component, route }">
            <!--
              ⚠️ **这层炸过一次、又验回来过，动它之前先读这段**（2026-09-30 现状：**已恢复 `<transition>`**）：
              - 冲突机制（源码级）：`<transition mode="out-in">` 要求"独占持有旧 child、等它 leave 收尾"，
                而 `<keep-alive>` 停用实例时走的是
                **`move(vnode, storageContainer, null, MoveType.LEAVE)`**（Vue 3.5.43 `@vue/runtime-core`
                的 `sharedContext.deactivate`）—— 把**同一个节点**直接搬进游离容器。两边攥一个节点 ⇒
                收尾/搬迁错位 ⇒ 旧页面**留在内容容器里**并逐次累积（2026-09-23 用"内容容器子节点数 +
                过渡类名 + 节点归属组件链"实测到过：一次导航两次 enter、leave 与 enter 同时进行）。
              - 但当时的**触发条件**是另一个 bug：`activateTab` 对同一路径重复 `$router.push`
                （日志一次路由变化打了 4 条）。该守卫当天已修（见本文件 `activateTab` 的 else 分支）。
              - 2026-09-30 用户拿"活样本"（`views/common/my/MyMessage.vue` 的站内信/会话子 tab，
                至今仍是 transition + keep-alive + 带 `:key` 的三件套）连续快速来回切、并在过渡没播完时
                继续切 ⇒ **没复现** ⇒ 恢复 `out-in` 试用（观感比 CSS 版顺：旧页会先淡出）。
              - **配套**：`assets/style.css` 里那条"挂页面卡片的 CSS 进入动画"已**注释掉**（否则与这里的
                transition **双层叠加** ⇒ 抖动）。要退回去：把那条注释换回来 + 删掉这里的 `<transition>`
                （备份在 `.codebuddy/backup-2026-09-30-fade-transform-back/`）。
              - **一旦复现**（判据：`document.querySelectorAll('.size-full-spin .ant-spin-container > *').length > 1`，
                或 Vue DevTools 里同时挂着两个页面组件）⇒ **第一件事就是回退这层 `<transition>`**，
                别去改 keep-alive / `:key`。
            -->
            <transition name="fade-transform" mode="out-in">
              <keep-alive v-if="Component">
                <component :is="Component" :key="getRouteCacheKey(route)"/>
              </keep-alive>
            </transition>
          </router-view>
        </a-spin>
      </a-flex>
      <l-layout-footer/>
    </a-flex>
  </a-layout-content>
</template>
