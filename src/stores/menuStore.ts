import {ref} from 'vue'
import {defineStore} from 'pinia'
import {STORE} from '@/constants'
import type {RouteResourceMetadata} from '@/types/apis'
import type {RestResult} from '@loncra/client/commons'
import {filterTreeDeep, unmergeTree} from '@loncra/client/commons'
import {AuthServerService, type ResourceEntity, type ResourceMetadata} from '@loncra/client/auth'
import {
  type RouteLocationNormalized,
  type RouteMeta,
  type Router,
  type RouteRecordNormalized
} from "vue-router";
import {requireNonNullOrUndefined} from '@/utils'
import {getRouteTitle} from '@/routers'
import {usePrincipalStore} from "@/stores/principalStore.ts";

export interface RouteEnterPage {
  loading: boolean
  fullPath: string
}

const RESET: MenuState = {
  menu: [],
  loading: false,
  currentBreadcrumbs: [],
  routeEnterPage: null,
  quickAccess:[]
}

export interface MenuState  {
  menu: ResourceEntity[]
  loading: boolean
  currentBreadcrumbs: RouteResourceMetadata[]
  routeEnterPage: RouteEnterPage | null
  quickAccess:RouteResourceMetadata[]
}

export const useMenuPrincipalStore = defineStore(STORE.MENU_ID, () => {
  const state = ref<MenuState>({...RESET})

  function $reset(): void {
    const principalStore = usePrincipalStore();
    const quickAccessRecord = getPrincipalQuickAccessRecord(principalStore.state.name)
    let quickAccess:RouteResourceMetadata[] = []
    if (principalStore.state.name !== '') {
      quickAccess = getCurrentQuickAccess(principalStore.state.name, quickAccessRecord);
    }
    state.value = {
      ...RESET,
      ...{quickAccess}
    }
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
    let quickAccess:RouteResourceMetadata[] | undefined = quickAccessRecord[principal]
    if (!quickAccess) {
      quickAccess = []
    }
    return quickAccess.slice().sort((a, b) => b.sort - a.sort);
  }

  function reset():MenuState {
    $reset()
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

  async function getPrincipalResources(
    types: string[],
    mergeTree: boolean = true,
  ): Promise<ResourceEntity[]> {
    if (state.value.menu.length > 0) {
      return state.value.menu;
    }
    state.value.loading = true;
    const result:RestResult<ResourceEntity[]> = await AuthServerService.principalResources(types, mergeTree)
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
      parentKeepAlive: route.meta?.parentKeepAlive,
      icon: (route.meta?.icon || 'loncra-file') as string,
      name: getRouteTitle(route.name),
      route: route.name,
      page: route.path,
      sort: 0,
      deactivatedClose: (route.meta?.deactivatedClose || false) as boolean,
      applicationName: route.meta?.applicationName as string,
      path: route.fullPath,
      fixed: route.meta?.fixed as boolean,
      single: (route.meta?.single || false) as boolean,
      dynamicTitle: (route.meta?.dynamicTitle || false) as boolean
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
    if (route.meta.quickAccess === false || Object.keys(route.query).length > 0 || route.meta.fixed) {
      return
    }

    const last = result.at(-1)
    if (!last) {
      return
    }
    setQuickAccess(last);
  }

  function setQuickAccess(route:RouteResourceMetadata) {
    const principalStore = usePrincipalStore();
    if (principalStore.state.name === '') {
      return
    }
    const quickAccessRecord = getPrincipalQuickAccessRecord(principalStore.state.name)
    const quickAccess:RouteResourceMetadata[] = getCurrentQuickAccess(principalStore.state.name, quickAccessRecord);

    const quickAccessItem: RouteResourceMetadata = { ...route, sort: 0 }
    const index = quickAccess.findIndex(m => m.path === quickAccessItem.path)
    if (index >= 0) {
      const item = quickAccess[index]
      if (item) {
        item.sort = item.sort + 1
      }
    } else {
      quickAccess.push(quickAccessItem)
    }
    state.value.quickAccess = quickAccess;
    quickAccessRecord[principalStore.state.name] = quickAccess
    localStorage.setItem(import.meta.env.VITE_APP_LOCAL_STORAGE_QUICK_ACCESS, JSON.stringify(quickAccessRecord))
  }

  function refreshQuickAccess() {
    state.value.quickAccess = getQuickAccess()
  }

  function getQuickAccess() {
    const principalStore = usePrincipalStore();
    if (principalStore.state.name === '') {
      return []
    }
    const quickAccessRecord = getPrincipalQuickAccessRecord(principalStore.state.name)
    return getCurrentQuickAccess(principalStore.state.name, quickAccessRecord)
  }

  function removeQuickAccess(path: string) {
    const principalStore = usePrincipalStore();
    if (principalStore.state.name === '') {
      return
    }
    const quickAccessRecord = getPrincipalQuickAccessRecord(principalStore.state.name)

    const quickAccess:RouteResourceMetadata[] = getCurrentQuickAccess(principalStore.state.name, quickAccessRecord);
    state.value.quickAccess = quickAccess.filter(item => item.path !== path);
    quickAccessRecord[principalStore.state.name] = state.value.quickAccess
    localStorage.setItem(import.meta.env.VITE_APP_LOCAL_STORAGE_QUICK_ACCESS, JSON.stringify(quickAccessRecord))
  }

  return {
    state,
    getPrincipalResources,
    setCurrentBreadcrumbs,
    resetCurrentBreadcrumbs,
    removeQuickAccess,
    refreshQuickAccess,
    setRouteEnterLoading,
    toResourceRouteMetadata,
    reset,
  }
})
