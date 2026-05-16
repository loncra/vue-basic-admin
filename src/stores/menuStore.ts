import {ref} from 'vue'
import {defineStore} from 'pinia'
import {STORE} from '@/constants/systemConstant.ts'
import type {ResourceEntity, ResourceMetadata, ResourceType, RouteResourceMetadata} from '@/types'
import {AuthServerService} from '@/apis'
import {isResultSuccess} from '@/requests'
import {
  type RouteLocationNormalized,
  type RouteMeta,
  type Router,
  type RouteRecordNormalized
} from "vue-router";
import {filterTreeDeep, requireNonNullOrUndefined, unmergeTree} from '@/utils'
import {getRouteTitle} from '@/routers'

/** 路由进入中：仅用于 tab 图标 spin（与 useRoute() 解耦，对齐 beforeEach 的 to.fullPath） */
export interface RouteEnterPage {
  loading: boolean
  fullPath: string
}

/**
 * 重置状态常量
 * 菜单存储的初始空状态
 */
const RESET: MenuState = {
  menu: [],
  laoding: false,
  currentBreadcrumbs: [],
  routeEnterPage: null,
}

export interface MenuState  {
  menu: ResourceEntity[]
  laoding: boolean
  currentBreadcrumbs: RouteResourceMetadata[]
  routeEnterPage: RouteEnterPage | null
}

/**
 * 菜单状态管理 Store
 * 用于管理后台用户的菜单资源数据
 */
export const useMenuPrincipalStore = defineStore(STORE.MENU_ID, () => {
  /** 菜单资源数据状态 */
  const state = ref<MenuState>({...RESET})

  /**
   * 重置菜单状态
   * 将菜单数据重置为空数组
   *
   * @returns 重置后的空菜单数组
   */
  function $reset(): MenuState {
    state.value = {
      menu: [],
      laoding: false,
      currentBreadcrumbs: [],
      routeEnterPage: null,
    }
    return state.value
  }

  function setRouteEnterLoading(pathKey: string, value: boolean) {
    if (!pathKey) {
      return
    }
    if (value) {
      state.value.routeEnterPage = {loading: true, fullPath: pathKey}
    } else {
      if (state.value.routeEnterPage?.fullPath !== pathKey) {
        return
      }
      state.value.routeEnterPage = null
    }
  }

  /**
   * 获取后台用户资源
   * 从服务端获取当前登录用户的菜单资源，并可选择是否合并为树形结构
   *
   * @param types - 资源类型数组，用于过滤特定类型的资源（如 'menu'、'security'）
   * @param mergeTree - 是否将资源合并为树形结构，默认为 true
   * @returns Promise 对象，成功时返回菜单资源数组
   * @throws {Error} 当获取资源失败时抛出错误
   */
  async function getPrincipalResources(
    types: ResourceType[],
    mergeTree: boolean = true,
  ): Promise<ResourceEntity[]> {
    if (state.value.menu.length > 0) {
      return state.value.menu;
    }
    state.value.laoding = true;
    const result = await AuthServerService.principalResources(types, mergeTree)
    if (!isResultSuccess(result)) {
      return []
    }
    // 更新状态并返回数据
    state.value.menu = result.data
    state.value.laoding = false;
    return state.value.menu
  }

  function setCurrentBreadcrumbs(currentBreadcrumbs:RouteResourceMetadata[]) {
    state.value.currentBreadcrumbs = currentBreadcrumbs;
  }

  function toResourceRouteMetadata(route: RouteLocationNormalized): RouteResourceMetadata {
    return {
      icon: (route.meta?.icon || 'icon-survey') as string,
      name: getRouteTitle(route.name),
      route: route.name,
      page: route.path,
      deactivatedClose: (route.meta?.deactivatedClose || false) as boolean,
      applicationName: route.meta?.applicationName as string,
      path: route.fullPath,
      fixed: route.meta?.fixed as boolean,
      single: (route.meta?.single || false) as boolean,
      dynamicTitle: (route.meta?.dynamicTitle || false) as boolean,
    }
  }

  function createResourceRouteMetadata(
    resource: ResourceMetadata,
    route: RouteLocationNormalized
  ): RouteResourceMetadata {
    let path:string = resource.page
    if (route.path === resource.page) {
      path = route.fullPath || route.path
    }
    return {
      ...resource,
      route:route.name,
      fixed: false,
      path: path,
      deactivatedClose:false,
      single: false,
      dynamicTitle: (route.meta?.dynamicTitle || false) as boolean,
    };
  }

  function resetCurrentBreadcrumbs(route: RouteLocationNormalized, router: Router) {
    const result: RouteResourceMetadata[] = []
    const meta = requireNonNullOrUndefined<RouteMeta>(route.meta)

    // 如果存在父路由，先查找并添加父路由信息
    if (meta.parent) {
      const parentRoute: RouteRecordNormalized | undefined = router.getRoutes()
      .find((r: RouteRecordNormalized) => r.path === meta.parent as string)
      if (parentRoute) {
        const data = filterTreeDeep<ResourceMetadata>(
          (r: ResourceMetadata) => r.page === parentRoute.path,
          state.value.menu,
        )

        const parentRoutes = unmergeTree<ResourceMetadata>(data).map(d => createResourceRouteMetadata(d, route))

        result.push(...parentRoutes)
      }

      result.push(toResourceRouteMetadata(route))
    } else {
      const data = filterTreeDeep<ResourceMetadata>(
        (r: ResourceMetadata) => r.page === route.path,
        state.value.menu,
      )
      const routes = unmergeTree<ResourceMetadata>(data).map(d => createResourceRouteMetadata(d, route))
      if (routes.length <= 0) {
        result.push(toResourceRouteMetadata(route))
      } else{
        result.push(...routes)
      }
    }
    state.value.currentBreadcrumbs = result;
  }

  return {
    state,
    getPrincipalResources,
    setCurrentBreadcrumbs,
    resetCurrentBreadcrumbs,
    setRouteEnterLoading,
    toResourceRouteMetadata,
    $reset,
  }
})
