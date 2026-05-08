<script setup lang="ts">

import {type RouteLocationNormalizedLoaded, useRouter} from "vue-router";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type { MenuItemType,  } from 'antdv-next'
import { requireNonNullOrUndefined } from '@/utils'
import { createIcon } from '@/utils'
import { nextTick, provide } from 'vue'
import { APP_RELOAD_PROVIDE_KEY } from '@/constants/systemConstant'
defineOptions({
  name: 'LLayoutContent',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const router = useRouter()

const activeKey = ref<string>('')
const isRouterAlive = ref(true)
const isFullscreen = ref(false)
const isFullscreenExiting = ref(false)
const routeCacheVersions = ref<Record<string, number>>({})
const panes = ref<RouteLocationNormalizedLoaded[]>([])

/** 用户手动固定的标签页（路由 name 集合），持久化到 localStorage */
const pinnedRouteNames = ref<Set<string>>(new Set())

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
    .map((r) => router.resolve({ name: r.name as string }) as RouteLocationNormalizedLoaded)
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
    panes.value.push(route)
    activeKey.value = route.name as string
    if (!(route.fullPath in routeCacheVersions.value)) {
      routeCacheVersions.value[route.fullPath] = 0
    }
  }
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
  const existingNames = new Set<string>()
  const initialPanes: RouteLocationNormalizedLoaded[] = []
  for (const r of fixedRoutes) {
    const name = r.name as string
    if (!existingNames.has(name)) {
      initialPanes.push(r)
      existingNames.add(name)
    }
  }
  for (const name of pinnedNames) {
    if (existingNames.has(name)) {
      continue
    }
    try {
      const loc = router.resolve({ name }) as RouteLocationNormalizedLoaded
      if (loc.name) {
        initialPanes.push(loc)
        existingNames.add(name)
      }
    } catch {
      // 路由可能尚未注册（如插件未加载），忽略
    }
  }
  panes.value = initialPanes
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
          <a-tabs @change="changeTab" :items="panes.map(p => ({label: p.meta?.title, key: p.name}))" type="editable-card" :active-key="activeKey" hide-add>
            <template #leftExtra>
              <a-tooltip :title="globalProperties.$t('layoutContent.reload')">
                <a-button type="text" @click="reload">
                  <template #icon>
                      <icon-font class="icon" type="icon-change" />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="isFullscreen ? globalProperties.$t('layoutContent.exitFullscreen') : globalProperties.$t('layoutContent.fullscreen')">
                <a-button type="text" @click="toggleFullscreen">
                  <template #icon>
                      <icon-font
                        class="icon"
                        :type="isFullscreen ? 'icon-reduce' : 'icon-move'"
                        :rotate="isFullscreen ? 0 : 45"
                      />
                  </template>
                </a-button>
              </a-tooltip>
              <a-dropdown :menu="{ items: operateItems }" >
                <a-button type="text">
                  <template #icon>
                    <icon-font class="icon" type="icon-more" />
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
              <component :is="Component" :key="getRouteCacheKey(route)" />
            </keep-alive>
          </transition>
        </router-view>
      </a-flex>
      <layout-footer />
    </a-flex>
  </a-layout-content>
</template>
