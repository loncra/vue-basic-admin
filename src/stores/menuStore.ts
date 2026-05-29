import {ref} from 'vue'
import {defineStore} from 'pinia'
import {STORE} from '@/constants/systemConstant.ts'
import type {
  ResourceEntity,
  ResourceMetadata,
  RestResult,
  RouteResourceMetadata
} from '@/types/apis'
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
import {usePrincipalStore} from "@/stores/principalStore.ts";

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
  loading: false,
  currentBreadcrumbs: [],
  routeEnterPage: null,
  quickAccess: [],
}

export interface MenuState  {
  menu: ResourceEntity[]
  loading: boolean
  currentBreadcrumbs: RouteResourceMetadata[]
  routeEnterPage: RouteEnterPage | null
  quickAccess: RouteResourceMetadata[]
}

/**
 * 菜单状态管理 Store
 * 用于管理后台用户的菜单资源数据
 */
export const useMenuPrincipalStore = defineStore(STORE.MENU_ID, () => {
  /** 菜单资源数据状态 */
  const state = ref<MenuState>(reset())

  /**
   * 重置菜单状态
   * 将菜单数据重置为空数组
   *
   * @returns 重置后的空菜单数组
   */
  function $reset(): MenuState {
    const result: MenuState = {
      ...RESET,
    }
    const principalStore = usePrincipalStore();
    const quickAccessRecord = getPrincipalQuickAccessRecord(principalStore.state.name)
    const quickAccess:RouteResourceMetadata[] = getCurrentQuickAccess(principalStore.state.name, quickAccessRecord);
    result.quickAccess = quickAccess.slice().sort((a, b) => b.sort - a.sort)
    return result
  }

  function getPrincipalQuickAccessRecord(principal:string) {
    let quickAccessRecord: Record<string, RouteResourceMetadata[]> = {}
    const string = localStorage.getItem(import.meta.env.VITE_APP_LOCAL_STORAGE_QUICK_ACCESS)
    if (string) {
      quickAccessRecord = JSON.parse(string) as Record<string, RouteResourceMetadata[]>
    }
    if (!quickAccessRecord[principal]) {
      quickAccessRecord[principal] = []
    }

    return quickAccessRecord;
  }

  function getCurrentQuickAccess(
    principal:string,
    quickAccessRecord: Record<string, RouteResourceMetadata[]>
  ) {
    const principalStore = usePrincipalStore();
    let quickAccess:RouteResourceMetadata[] | undefined = quickAccessRecord[principalStore.state.name]
    if (!quickAccess) {
      quickAccess = []
    }
    return quickAccess;
  }

  function reset():MenuState {
    return $reset()
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
    types: string[],
    mergeTree: boolean = true,
  ): Promise<ResourceEntity[]> {
    if (state.value.menu.length > 0) {
      return state.value.menu;
    }
    state.value.loading = true;
    const result:RestResult<ResourceEntity[]> = await AuthServerService.principalResources(types, mergeTree)
    if (!isResultSuccess(result)) {
      return []
    }
    const menu = result.data ?? []
    state.value.menu = menu
    state.value.loading = false
    return menu
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
      sort: 0,
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
    if (Object.keys(route.query).length > 0 || route.meta.fixed || ["400", "403", "404"].includes(route.name as string)) {
      return
    }

    const last = result.at(-1)
    if (!last) {
      return // 或跳过 quickAccess 逻辑
    }
    setQuickAccess(last);
  }

  function setQuickAccess(route:RouteResourceMetadata) {
    const principalStore = usePrincipalStore();
    const quickAccessRecord = getPrincipalQuickAccessRecord(principalStore.state.name)
    const quickAccess:RouteResourceMetadata[] = getCurrentQuickAccess(principalStore.state.name, quickAccessRecord);
;
    const quickAccessItem: RouteResourceMetadata = { ...route, sort: 0 }
    const index = quickAccess.findIndex(m => m.path === quickAccessItem.path)
    if (index >= 0) {
      const item = quickAccess[index]
      if (item) {
        item.sort = item.sort + 1
      }
    } else {
      quickAccess.push(quickAccessItem) // 若不存在则要 push，否则永远不会新增
    }
    state.value.quickAccess =  quickAccess.slice().sort((a, b) => b.sort - a.sort)
    localStorage.setItem(import.meta.env.VITE_APP_LOCAL_STORAGE_QUICK_ACCESS, JSON.stringify(quickAccessRecord))
  }

  function removeQuickAccess(path: string) {
    const principalStore = usePrincipalStore();
    const quickAccessRecord = getPrincipalQuickAccessRecord(principalStore.state.name)
    quickAccessRecord[principalStore.state.name] = (quickAccessRecord[principalStore.state.name] || []).filter(item => item.path !== path)
    localStorage.setItem(import.meta.env.VITE_APP_LOCAL_STORAGE_QUICK_ACCESS, JSON.stringify(quickAccessRecord))
    state.value.quickAccess = (quickAccessRecord[principalStore.state.name] || []).slice().sort((a, b) => b.sort - a.sort)
  }

  return {
    state,
    getPrincipalResources,
    setCurrentBreadcrumbs,
    resetCurrentBreadcrumbs,
    removeQuickAccess,
    setRouteEnterLoading,
    toResourceRouteMetadata,
    $reset,
  }
})
