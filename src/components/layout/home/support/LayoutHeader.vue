<script setup lang="ts">
import {useMenuPrincipalStore} from '@/stores/menuStore.ts'
import {type ComponentInternalInstance, computed, getCurrentInstance} from 'vue'
import {filterTreeDeep, requireNonNullOrUndefined, unmergeTree} from '@/utils'
import LProfileButton from '@/components/config/ProfilesButton.vue'
import LMenu from '@/components/layout/Menu.vue'
import type {MenuData} from "@/types";
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {
  RouteLocationNormalized,
  RouteMeta,
  RouteRecordNormalized,
  RouteRecordRaw
} from "vue-router";

defineOptions({
  name: 'LLayoutHeader',
})

const menuPrincipalStore = useMenuPrincipalStore()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const currentBreadcrumbs = computed((): MenuData[] => {
  const result: MenuData[] = []

  const route: RouteLocationNormalized = globalProperties.$route
  const meta = requireNonNullOrUndefined<RouteMeta>(route.meta)

  // 如果存在父路由，先查找并添加父路由信息
  if (meta.parent) {
    const parentRoute: RouteRecordNormalized | undefined = globalProperties.$router
      .getRoutes()
      .find((r: RouteRecordRaw) => r.name === meta.parent)
    if (parentRoute) {
      const data = filterTreeDeep<MenuData>(
        (r: MenuData) => r.page === parentRoute.path,
        menuPrincipalStore.state,
      )
      result.push(...unmergeTree<MenuData>(data))
    }

    result.push(<MenuData>{
      icon: meta.icon,
      name: meta.title,
      applicationName: meta.applicationName,
    })
  } else {
    const data = filterTreeDeep<MenuData>(
      (r: MenuData) => r.page === route.path,
      menuPrincipalStore.state,
    )
    result.push(...unmergeTree<MenuData>(data))
  }

  return result
})
</script>

<template>
  <a-layout-header class="layout-header">
    <a-flex justify="space-between" class="h-full" align="center">
      <a-breadcrumb>
        <a-breadcrumb-item v-for="(breadcrumb, index) in currentBreadcrumbs" :key="breadcrumb.name">
          <a-space>
            <icon-font class="icon align" :type="breadcrumb.icon || 'icon-survey'" />
            <a-typography-link
              v-if="index != currentBreadcrumbs.length - 1 && breadcrumb.page"
              :href="breadcrumb.page"
            >
              <a-typography-text type="secondary">
                {{ breadcrumb.name }}
              </a-typography-text>
            </a-typography-link>
            <a-typography-text v-else strong>
              {{ breadcrumb.name }}
            </a-typography-text>
          </a-space>
        </a-breadcrumb-item>
      </a-breadcrumb>
      <a-space align="center">
        <l-menu :menu-types="[RESOURCE_TYPE.TOOL]" :hide-label="true" mode="horizontal" />
        <l-profile-button />
      </a-space>
    </a-flex>
  </a-layout-header>
</template>
