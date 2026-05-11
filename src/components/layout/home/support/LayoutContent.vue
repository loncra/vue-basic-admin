<script setup lang="ts">

import {type RouteLocationNormalizedLoaded, useRouter} from 'vue-router'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  nextTick,
  onMounted,
  provide,
  ref,
  watch
} from 'vue'
import type {MenuItemType} from 'antdv-next'
import {createIcon, filterTreeDeep, requireNonNullOrUndefined, unmergeTree} from '@/utils'
import {APP_RELOAD_PROVIDE_KEY} from '@/constants/systemConstant'
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import type {ResourceMetadata} from '@/types'

defineOptions({
  name: 'LLayoutContent',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const router = useRouter()
const menuPrincipalStore = useMenuPrincipalStore()

const activeKey = ref<string>('')
const isRouterAlive = ref(true)
const isFullscreen = ref(false)
const isFullscreenExiting = ref(false)
const routeCacheVersions = ref<Record<string, number>>({})
const panes = ref<RouteLocationNormalizedLoaded[]>([])

/** 用户手动固定的标签页（路由 name 集合），持久化到 localStorage */
const pinnedRouteNames = ref<Set<string>>(new Set())
const fixedRouteNames = ref<Set<string>>(new Set())

const operateItems = ref<MenuItemType[]>([
  {
    key: 'close-others',
    label: globalProperties.$t('layoutContent.close.others'),
    icon: () => createIcon('icon-close'),
  },
  {
    key: 'close-right',
    label: globalProperties.$t('layoutContent.close.right'),
    icon: () => createIcon('icon-close'),
  },
])

provide(APP_RELOAD_PROVIDE_KEY, reload)

function getRouteCacheKey(route: RouteLocationNormalizedLoaded): string {
  const version = routeCacheVersions.value[route.fullPath] || 0
  return `${route.fullPath}-v${version}`
}


function getFixedRoutesFromRouter(): RouteLocationNormalizedLoaded[] {
  const homeRoute = router.getRoutes().find((r) => r.name === import.meta.env.VITE_APP_HOME_PAGE_NAME)
  if (!homeRoute?.children?.length) {
    return []
  }
  const fixed = homeRoute.children
    .filter((r) => r.name && (r.meta?.fixed as boolean))
    .sort((a, b) => ((a.meta?.sort as number) ?? 0) - ((b.meta?.sort as number) ?? 0))
  return fixed
    .map((r) => router.resolve({name: r.name as string}) as RouteLocationNormalizedLoaded)
    .filter((loc) => loc.name)
}

function loadPinnedFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(import.meta.env.VITE_APP_LOCAL_STORAGE_FIXED_TABS_NAME)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function activateSegmented(route: RouteLocationNormalizedLoaded) {
  const current = panes.value.find((p) => p.name === route.name)

  if (current) {
    activeKey.value = current.name as string
    if (globalProperties.$route.fullPath !== current.fullPath) {
      globalProperties.$router.push(current.fullPath)
    }
  } else {
    addPane(route);
    activeKey.value = route.name as string
    if (!(route.fullPath in routeCacheVersions.value)) {
      routeCacheVersions.value[route.fullPath] = 0
    }
  }
}

function addPane(route: RouteLocationNormalizedLoaded): void {
  const data = filterTreeDeep<ResourceMetadata>(
    (r: ResourceMetadata) => r.page === route.path,
    menuPrincipalStore.state,
  )
  const unmergeData = unmergeTree<ResourceMetadata>(data)
  const last = unmergeData.at(-1)
  if (last) {
    route.meta.title = last.name
    route.meta.icon = last.icon
  }
  panes.value.push(route)
}

function changeTab(value: string | number) {
  const current = panes.value.find((p) => p.name === value)
  if (!current) {
    return
  }
  activateSegmented(current)
}

function mounted(): void {
  const route = globalProperties.$route
  const fixedRoutes = getFixedRoutesFromRouter()
  const pinnedNames = loadPinnedFromStorage()
  pinnedRouteNames.value = new Set(pinnedNames)
  const initialPanes: RouteLocationNormalizedLoaded[] = []
  for (const r of fixedRoutes) {
    const name = r.name as string
    if (!fixedRouteNames.value.has(name)) {
      initialPanes.push(r)
      fixedRouteNames.value.add(name)
    }
  }
  for (const name of pinnedNames) {
    try {
      const loc = router.resolve({name}) as RouteLocationNormalizedLoaded
      if (loc.name) {
        initialPanes.push(loc)
      }
    } catch {
      // 路由可能尚未注册（如插件未加载），忽略
    }
  }
  initialPanes.map(r => addPane(r))
  activateSegmented(route)
  if (!(route.fullPath in routeCacheVersions.value)) {
    routeCacheVersions.value[route.fullPath] = 0
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
function isPaneFixed(pane: RouteLocationNormalizedLoaded): boolean {
  return (pane.meta?.fixed as boolean) || pinnedRouteNames.value.has(pane.name as string)
}

function savePinnedToStorage() {
  localStorage.setItem(
    import.meta.env.VITE_APP_LOCAL_STORAGE_FIXED_TABS_NAME,
    JSON.stringify([...pinnedRouteNames.value]),
  )
}

/** 取消固定 */
function onUnpin() {
  const route = globalProperties.$route
  const name = route.name as string
  if (!name) {
    return
  }
  pinnedRouteNames.value.delete(name)
  savePinnedToStorage()
}

/** 固定当前标签页 */
function onPin() {
  const route = globalProperties.$route
  const name = route.name as string
  if (!name) {
    return
  }
  pinnedRouteNames.value.add(name)
  pinnedRouteNames.value = new Set(pinnedRouteNames.value)
  savePinnedToStorage()
}

/** 关闭其他标签页：保留当前标签页和所有 fixed 标签页 */
function onCloseOthers() {
  const currentRoute = globalProperties.$route
  const toKeep = (p: RouteLocationNormalizedLoaded) =>
    isPaneFixed(p) || p.name === currentRoute.name
  const toRemove = panes.value.filter((p) => !toKeep(p))
  toRemove.forEach((p) => {
    const v = routeCacheVersions.value[p.fullPath] || 0
    routeCacheVersions.value[p.fullPath] = v + 1
  })
  panes.value = panes.value.filter(toKeep)
  activeKey.value = currentRoute.name as string
}

/** 关闭右侧标签页 */
function onCloseRight() {
  const currentRoute = globalProperties.$route
  const idx = panes.value.findIndex((p) => p.name === currentRoute.name)
  if (idx < 0) {
    return
  }
  const toRemove = panes.value.slice(idx + 1).filter((p) => !isPaneFixed(p))
  toRemove.forEach((p) => {
    const v = routeCacheVersions.value[p.fullPath] || 0
    routeCacheVersions.value[p.fullPath] = v + 1
  })
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
  operateItems.value = operateItems.value.filter(
    (v) => v?.key != null && !['unpin', 'pin'].includes(String(v.key)),
  )
  const route = globalProperties.$route
  const name = route.name as string
  if (fixedRouteNames.value.has(name)) {
    return
  }
  if (pinnedRouteNames.value.has(name)) {
    operateItems.value.unshift({
      key: 'unpin',
      label: globalProperties.$t('layoutContent.unpin'),
      icon: () => createIcon('icon-unlock'),
    })
  } else {
    operateItems.value.unshift({
      key: 'pin',
      label: globalProperties.$t('layoutContent.pin'),
      icon: () => createIcon('icon-pin'),
    })
  }
}

function onRemoveTab(value: string, action: string) {
  if (action !== 'remove') {
    return
  }
  const pane = panes.value.find((p) => p.name === value)
  if (!pane || isPaneFixed(pane)) {
    return
  }
  const index = panes.value.findIndex((p) => p.name === value)
  const targetRoute = panes.value[index]
  if (targetRoute) {
    const currentVersion = routeCacheVersions.value[targetRoute.fullPath] || 0
    routeCacheVersions.value[targetRoute.fullPath] = currentVersion + 1
  }
  const change = panes.value[index - 1]
  if (change) {
    activateSegmented(change)
  }
  panes.value = panes.value.filter((p) => p.name !== value)
}

watch(
  () => globalProperties.$route,
  () => activateSegmented(globalProperties.$route),
  { deep: true },
)

onMounted(mounted)
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
        <div class="tool-bar ">
          <a-tabs
            @change="changeTab"
            :items="panes.map((p) => ({ label: p.meta?.title, iconString: p.meta?.icon, key: p.name, closable: !pinnedRouteNames.has(p.name as string) && !fixedRouteNames.has(p.name as string) }))"
            type="editable-card"
            :active-key="activeKey"
            hide-add
            @edit="onRemoveTab"
          >
            <template #labelRender="{ item }">
              <a-space>
                <icon-font class="icon align" :type="item.iconString || 'icon-survey'"/>
                <span>{{item.label}}</span>
              </a-space>
            </template>
            <template #leftExtra>
              <a-tooltip :title="globalProperties.$t('layoutContent.reload')">
                <a-button type="text" @click="reload">
                  <template #icon>
                    <icon-font class="icon align" type="icon-change"/>
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
                      :type="isFullscreen ? 'icon-reduce' : 'icon-move'"
                      :rotate="isFullscreen ? 0 : 45"
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
                    <icon-font class="icon align" type="icon-more"/>
                  </template>
                </a-button>
              </a-dropdown>
            </template>
          </a-tabs>
        </div>
      </a-flex>
      <a-flex vertical flex="1" class="pr-md pl-md">

        <router-view v-if="isRouterAlive" v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <!-- 使用 key 来清除缓存：key = fullPath + 版本号 -->
            <!-- 当关闭标签页时，版本号会增加，key 改变，keep-alive 会销毁旧实例并创建新实例 -->
            <!-- 无 Component 时不渲染 keep-alive，避免空白（如路由未解析完） -->
            <keep-alive v-if="Component">
              <component :is="Component" :key="getRouteCacheKey(route)"/>
            </keep-alive>
          </transition>
        </router-view>
      </a-flex>
      <layout-footer/>
    </a-flex>
  </a-layout-content>
</template>
