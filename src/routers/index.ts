import type {
  NavigationGuardWithThis,
  RouteLocationNormalized,
  RouteRecordName,
  RouteRecordRaw
} from 'vue-router'
import {createRouter, createWebHistory} from 'vue-router'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import type {ResourceEntity} from "@loncra/client/auth";
import {
  AUTH_SERVER_AUTHENTICATION_TYPE,
  AUTH_SERVER_RESOURCE_TYPE,
  AUTHENTICATION_MEMBER_TYPE
} from '@loncra/client/auth'
import type {RouteTitleGetter, RouteTitleMap, RouteTitleParams} from "@/types/composables";
import {RESOURCE_SERVER_USER_EXPORT_ROUTE, SYSTEM_ROUTE} from '@/constants'
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {nextTick, ref, watch} from 'vue'
import {unmergeTree} from '@loncra/client/commons'

import i18n from '@/i18n'
import {useSocketStore} from "@/stores/socketStore.ts";
import {useBootstrapStore} from "@/stores/bootStore.ts";

const childrenRoutes: RouteRecordRaw[] = [
  {
    path: '/error/403',
    name: SYSTEM_ROUTE.FORBIDDEN,
    component: () => import('@/views/error/Forbidden.vue'),
    meta: {
      quickAccess:false,
      deactivatedClose: true,
      applicationName: 'system',
      icon: 'loncra-message-circle-warning',
    }
  },
  {
    path: '/error/400',
    name: SYSTEM_ROUTE.BAD_REQUEST,
    component: () => import('@/views/error/BadRequest.vue'),
    meta: {
      quickAccess:false,
      applicationName: 'system',
      icon: 'loncra-badge-alert',
      deactivatedClose: true,
    }
  },
  {
    path: '/commons/workbench',
    name: SYSTEM_ROUTE.WORKBENCH,
    component: () => import('@/views/common/Workbench.vue'),
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
      fixed: true,
      sort: 0,
    },
  },
  {
    path: '/commons/user/export',
    name: RESOURCE_SERVER_USER_EXPORT_ROUTE,
    component: () => import('@/views/common/UserExport.vue'),
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
    },
  },
  {
    path: '/commons/setting',
    name: SYSTEM_ROUTE.SETTING,
    component: () => import('@/views/common/setting/Setting.vue'),
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
    },
  },
  {
    path: '/commons/agent',
    name: SYSTEM_ROUTE.AGENT,
    component: () => import('@/views/common/AiAgent.vue'),
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
    },
  },
  {
    path: '/commons/my/message',
    name: SYSTEM_ROUTE.MY_MESSAGE,
    redirect: {name: SYSTEM_ROUTE.MY_CHAT_MESSAGE},
    component: () => import('@/views/common/my/MyMessage.vue'),
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
    },
    children:[{
      path: '/commons/my/message/site',
      name: SYSTEM_ROUTE.MY_SITE_MESSAGE,
      component: () => import('@/views/common/my/MySiteMessage.vue'),
      meta: {
        applicationName: 'commons',
        parentKeepAlive:'/commons/my/message',
        requiresAuth: true,
      },
    },{
      path: '/commons/my/message/chat',
      name: SYSTEM_ROUTE.MY_CHAT_MESSAGE,
      component: () => import('@/views/common/my/MyChatMessage.vue'),
      meta: {
        applicationName: 'commons',
        parentKeepAlive:'/commons/my/message',
        requiresAuth: true,
      },
    }]
  },
]

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: SYSTEM_ROUTE.ROOT,
    redirect: {name: SYSTEM_ROUTE.WORKBENCH},
  },
  {
    path: '/' + SYSTEM_ROUTE.AUTH + '/:authenticationType(console|personal)?',
    name: SYSTEM_ROUTE.AUTH,
    component: () => import('@/views/Auth.vue')
  },
  {
    path: '/forgot/password',
    name: SYSTEM_ROUTE.FORGOT_PASSWORD,
    component: () => import('@/views/ForgotPassword.vue')
  },
  {
    path: '/error/404',
    name: SYSTEM_ROUTE.NOT_FOUND,
    component: () => import('@/views/error/NotFound.vue'),
    meta:{
      quickAccess:false,
    }
  },
  {
    path: '/' + SYSTEM_ROUTE.HOME_PAGE,
    name: SYSTEM_ROUTE.HOME_PAGE,
    component: () => import('@/views/Home.vue'),
    children: childrenRoutes
  }
]

const modules = import.meta.glob('@/routers/**/*.ts') as Record<
  string,
  () => Promise<{ default: RouteRecordRaw[] }>
>
const i18nModules = import.meta.glob<RouteTitleMap>('@/routers/**/*.i18n.ts', {
  eager: true,
  import: 'default',
})

const initialState = ref<boolean>(false)

export const routeI18n: RouteTitleMap = Object.assign({}, ...Object.values(i18nModules))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

function resolveParamValue(value: string): string {
  return i18n.global.te(value) ? i18n.global.t(value) : value
}

function resolveParams(params?: RouteTitleParams): Record<string, string> | undefined {
  if (!params) {
    return undefined
  }
  const resolved: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    resolved[key] = resolveParamValue(value as string)
  }
  return resolved
}

export function resolveRouteTitle(getter: RouteTitleGetter): string {
  const [key, params] = getter()
  const resolvedParams = resolveParams(params)
  if (resolvedParams) {
    return i18n.global.t(key, resolvedParams)
  }
  return i18n.global.t(key)
}

export function getRouteTitle(name: RouteRecordName): string {
  if (name as string in routeI18n) {
    const getter = routeI18n[name as string]
    if (getter) {
      return resolveRouteTitle(getter)
    }
  }
  const route = router.getRoutes().find(r => r.name === name)
  if (!route) {
    return i18n.global.t('common.unname')
  }
  const metaTitle = route.meta?.title
  if (typeof metaTitle === 'string' && metaTitle !== '') {
    return metaTitle
  }
  return i18n.global.t('common.unname')
}

export const clearDynamicRoutes = (): void => {
  initialState.value = false
  router.clearRoutes()
  routes.forEach((r) => router.addRoute(r))
}

const loadServiceRoutes = async (serviceName?: string[]): Promise<RouteRecordRaw[]> => {
  const promises = []

  for (const key in modules) {
    if (key.includes('.i18n.ts') || key.includes('/routers/i18n/')) {
      continue
    }
    if (key.endsWith('/index.ts')) {
      continue
    }
    if (serviceName && !serviceName.some(path => key.toLowerCase().includes(path.toLowerCase()))) {
      continue
    }

    const fn = modules[key]
    if (typeof fn !== 'function') {
      continue
    }

    promises.push(fn())
  }
  const importRoutes: RouteRecordRaw[] = []
  const routeModules = await Promise.all(promises)
  for (const module of routeModules) {
    if (!module.default || !Array.isArray(module.default)) {
      continue
    }
    importRoutes.push(...module.default)
  }
  return importRoutes
}

const applyRouteMetaToMenu = (
  route: RouteRecordRaw,
  menus: ResourceEntity[],
) => {
  const menuData = menus.find(m => route.path === m.page)
  if (!menuData) {
    return
  }
  const meta = route.meta || {}
  meta.title = menuData.name
  meta.applicationName = menuData.applicationName
  meta.icon = menuData.icon
  if (route.children && route.children.length > 0) {
    route.children.forEach(m => applyRouteMetaToMenu(m, menus))
  }
}

export const registerServiceRoutes = async (serviceName: string[]): Promise<RouteRecordRaw[]> => {
  const services = serviceName.length > 0 ? serviceName : undefined
  if (import.meta.env.DEV) {
    if (!services) {
      console.warn('[bootstrap] 后端返回的 pluginServices 为空，已降级注册全部服务路由')
    } else {
      console.debug('[bootstrap] pluginServices =', serviceName)
    }
  }
  const importRoutes: RouteRecordRaw[] = await loadServiceRoutes(services)
  importRoutes.forEach((route) => router.addRoute(SYSTEM_ROUTE.HOME_PAGE, route))
  initialState.value = true
  return importRoutes
}

export const applyMenusToRoutes = async (importRoutes: RouteRecordRaw[]): Promise<void> => {
  const menuPrincipalStore = useMenuPrincipalStore()
  const menus = await menuPrincipalStore.getPrincipalResources([
    AUTH_SERVER_RESOURCE_TYPE.ROOT,
    AUTH_SERVER_RESOURCE_TYPE.DIRECTORY,
    AUTH_SERVER_RESOURCE_TYPE.MENU,
    AUTH_SERVER_RESOURCE_TYPE.TOOL,
    AUTH_SERVER_RESOURCE_TYPE.PROFILE,
    AUTH_SERVER_RESOURCE_TYPE.NAVIGATION_DATA
  ])
  const unmergeMenus = unmergeTree<ResourceEntity>(menus);
  for (const route of [...childrenRoutes, ...importRoutes]) {
    applyRouteMetaToMenu(route, unmergeMenus)
  }
}

export const saveRequestPathThenToAuth = (
  href:string,
  authenticationType:string = AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE
)=> {

  sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_REQUEST_PATH_NAME, href)
  return getAuthRouterParam(authenticationType)
}

export const getAuthRouterParam =  (
  authenticationType:string = AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE
)=> {
  if (AUTHENTICATION_MEMBER_TYPE.includes(authenticationType)) {
    authenticationType = AUTH_SERVER_AUTHENTICATION_TYPE.PERSONAL
  }
  return {
    name: SYSTEM_ROUTE.AUTH,
    params: {
      authenticationType:(authenticationType).toLowerCase(),
    },
  }
}

const onBeforeEach: NavigationGuardWithThis<unknown> = async (to) => {
  const principalStore = usePrincipalStore()
  const socketStore = useSocketStore()
  const menuPrincipalStore = useMenuPrincipalStore()

  if (to.name === SYSTEM_ROUTE.AUTH) {
    socketStore.disconnect()
    await principalStore.logout()
    clearDynamicRoutes()
    menuPrincipalStore.reset()
    return
  } else if (routes.some(route => route.name === to.name)) {
    return
  }

  await useBootstrapStore().waitReady()

  if (to.matched.length === 0 && !to.redirectedFrom) {
    return {...to, replace: true}
  }

  const requiresAuth = (to.meta.requiresAuth || false) && !principalStore.isAuthenticated
  const requiresFullyAuth =
    (to.meta.requiresFullyAuth || false) && !principalStore.isFullyAuthenticated

  if (requiresAuth || requiresFullyAuth) {
    return saveRequestPathThenToAuth(to.fullPath, String(to.meta.authenticationType || principalStore.state.type))
  }


  menuPrincipalStore.setRouteEnterLoading(to.fullPath, true)
  return true
}

const onAfterEach = (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  const menuPrincipalStore = useMenuPrincipalStore()
  menuPrincipalStore.resetCurrentBreadcrumbs(to, router)
  nextTick(() => menuPrincipalStore.setRouteEnterLoading(to.fullPath, false))
}

router.beforeEach(onBeforeEach)

router.afterEach(onAfterEach)

watch(
  () => i18n.global.locale.value,
  () => {
    if (!initialState.value) {
      return
    }
    const menuPrincipalStore = useMenuPrincipalStore()
    menuPrincipalStore.resetCurrentBreadcrumbs(router.currentRoute.value, router)
  },
)

export default router
