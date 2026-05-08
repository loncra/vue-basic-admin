<script setup lang="ts">

import {type RouteLocationNormalizedLoaded, useRouter} from "vue-router";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type { MenuItemType,  } from 'antdv-next'
import { requireNonNullOrUndefined } from '@/utils'
import { createIcon } from '@/utils'

defineOptions({
  name: 'LLayoutContent',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const router = useRouter()

const isRouterAlive = ref(true)
const routeCacheVersions = ref<Record<string, number>>({})
const tabItems = ref<Record<string, undefined>[]>([{
  key: '1',
  label: 'Tab 1',
  icon: () => createIcon('icon-home'),
},
{
  key: '2',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '3',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '4',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '5',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '6',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '7',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '8',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '9',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '10',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '11',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '12',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '13',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '14',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
},
{
  key: '15',
  label: 'Tab 2',
  icon: () => createIcon('icon-home'),
}])

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

function getRouteCacheKey(route: RouteLocationNormalizedLoaded): string {
  const version = routeCacheVersions.value[route.fullPath] || 0
  return `${route.fullPath}-v${version}`
}
</script>

<template>
  <a-layout-content
    class="h-full overflow-hidden"
  >
    <a-flex vertical class="overflow-auto h-full">
      <!-- 顶部操作区：左侧预留按钮，右侧分段器充当标签导航 -->
      <a-flex align="center" justify="center" class="layout-content-operation">
        <div class="tool-bar ">
          <a-tabs class="min-w-0 max-w-full w-full" :items="tabItems">
            <template #leftExtra>
              <a-button type="text">
                <template #icon>
                  <icon-font class="icon" type="icon-change" />
                </template>
              </a-button>
              <a-button type="text">
                <template #icon>
                  <icon-font
                    class="icon"
                    type="icon-reduce"
                  />
                </template>
              </a-button>
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
