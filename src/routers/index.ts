import type {
  NavigationGuardWithThis,
  RouteLocationNormalized,
  RouteRecordName,
  RouteRecordRaw
} from 'vue-router'
import {createRouter, createWebHistory} from 'vue-router'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import type {PrepareData, ResourceEntity,} from "@/types/apis";
import type {RouteTitleGetter, RouteTitleMap, RouteTitleParams} from "@/types/composables";
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {nextTick, ref, watch} from 'vue'
import {unmergeTree} from '@/utils'

import Auth from '@/views/Auth.vue'
import Home from '@/views/Home.vue'
import Workbench from '@/views/common/Workbench.vue'
import UserExport from "@/views/common/UserExport.vue";
import MyMessage from '@/views/common/MyMessage.vue'
import Setting from '@/views/common/Setting.vue'
import NotFound from '@/views/error/NotFound.vue';
import Forbidden from '@/views/error/Forbidden.vue';
import BadRequest from '@/views/error/BadRequest.vue';

import MySiteMessage from "@/views/common/my/MySiteMessage.vue";
import MyChatMessage from "@/views/common/my/MyChatMessage.vue";

import i18n from '@/i18n'
import {useSocketStore} from "@/stores/socketStore.ts";

/**
 * 首页的子路由配置
 * 这些路由会作为 Home 组件的子路由显示
 */
const childrenRoutes: RouteRecordRaw[] = [
  {
    path: '/error/403',
    name: '403',
    component: Forbidden,
    meta: {
      deactivatedClose: true,
      applicationName: 'system',
      icon: 'loncra-message-circle-warning',
    }
  },
  {
    path: '/error/400',
    name: '400',
    component: BadRequest,
    meta: {
      applicationName: 'system',
      icon: 'loncra-badge-alert',
      deactivatedClose: true,
    }
  },
  {
    path: '/commons/workbench',
    name: import.meta.env.VITE_APP_HOME_ROUTE_PAGE_NAME,
    component: Workbench,
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
      fixed: true,
      sort: 0,
    },
  },
  {
    path: '/commons/user/export',
    name: "user_export",
    component: UserExport,
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
    },
  },
  {
    path: '/commons/setting',
    name: 'setting',
    component: Setting,
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
    },
  },
  {
    path: '/commons/my/message',
    name: 'my_message',
    redirect: {name: 'my_chat_message'},
    component: MyMessage,
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
    },
    children:[{
      path: '/commons/my/message/site',
      name: 'my_site_message',
      component: MySiteMessage,
      meta: {
        applicationName: 'commons',
        parentKeepAlive:'/commons/my/message',
        requiresAuth: true,
      },
    },{
      path: '/commons/my/message/chat',
      name: 'my_chat_message',
      component: MyChatMessage,
      meta: {
        applicationName: 'commons',
        parentKeepAlive:'/commons/my/message',
        requiresAuth: true,
      },
    }]
  },
]

/**
 * 基础路由配置
 * 定义应用的核心路由结构
 */
const routes: RouteRecordRaw[] = [
  {
    // 根路径，重定向到工作台
    path: '/',
    name: 'root',
    redirect: {name: import.meta.env.VITE_APP_HOME_ROUTE_PAGE_NAME},
  },
  {
    // 认证页面路由
    path: '/' + import.meta.env.VITE_APP_AUTH_PAGE_NAME,
    name: import.meta.env.VITE_APP_AUTH_PAGE_NAME,
    component: Auth
  },
  {
    path: '/error/404',
    name: '404',
    component: NotFound
  },
  {
    // 首页路由，包含子路由
    path: '/' + import.meta.env.VITE_APP_HOME_PAGE_NAME,
    name: import.meta.env.VITE_APP_HOME_PAGE_NAME,
    component: Home,
    children: childrenRoutes
  }/*,
  {
    path: "/:pathMatch(.*)*",
    name: 'NotFound',
    redirect: "/error/404"
  }*/
]

/**
 * 使用 Vite 的 glob 功能动态导入目录下的路由配置文件
 */
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

/**
 * 创建 Vue Router 实例
 * 使用 HTML5 History 模式
 */
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

/**
 * 清除所有路由并重新添加基础路由
 * 用于重置路由状态
 */
const clearRoute = (): void => {
  initialState.value = false
  router.clearRoutes()
  routes.forEach((r) => router.addRoute(r))
}

const loadServiceRoutes = async (serviceName: string[]): Promise<RouteRecordRaw[]> => {
  const promises = []

  // 遍历所有路由模块
  for (const key in modules) {
    if (key.includes('.i18n.ts') || key.includes('/routers/i18n/')) {
      continue
    }
    // 检查模块是否属于指定的插件服务
    if (serviceName.length > 0 && !serviceName.some(path => key.includes(path))) {
      continue
    }

    const fn = modules[key]
    if (typeof fn !== 'function') {
      continue
    }

    // 收集需要加载的路由模块
    promises.push(fn())
  }
  const importRoutes: RouteRecordRaw[] = []
  // 等待所有路由模块加载完成
  const routeModules = await Promise.all(promises)
  // 将加载的路由添加到路由中（添加到 home 路由的子路由中）
  for (const module of routeModules) {
    if (!module.default || !Array.isArray(module.default)) {
      continue
    }
    importRoutes.push(...module.default)
  }
  return importRoutes
}

/**
 * 动态加载插件服务的路由
 * 根据提供的插件服务名称，加载对应的路由配置文件并添加到路由中
 *
 * @param route
 * @param menus
 *
 * @returns Promise 对象，路由加载完成后解析
 */
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

const loadRouter = async (serviceName: string[]): Promise<RouteRecordRaw[]> => {
  const importRoutes: RouteRecordRaw[] = await loadServiceRoutes(serviceName)

  const menuPrincipalStore = useMenuPrincipalStore()
  const menus = await menuPrincipalStore.getPrincipalResources([
    RESOURCE_TYPE.ROOT,
    RESOURCE_TYPE.DIRECTORY,
    RESOURCE_TYPE.MENU,
    RESOURCE_TYPE.TOOL,
    RESOURCE_TYPE.PROFILE,
    RESOURCE_TYPE.NAVIGATION_DATA
  ])
  const unmergeMenus = unmergeTree<ResourceEntity>(menus);
  const menuRoutes = [...childrenRoutes, ...importRoutes]
  for (const route of menuRoutes) {
    applyRouteMetaToMenu(route, unmergeMenus)
  }

  importRoutes.forEach((route) => router.addRoute(import.meta.env.VITE_APP_HOME_PAGE_NAME, route))
  return importRoutes
}

const reloadRoute = async (): Promise<RouteRecordRaw[]> => {
  if (initialState.value) {
    clearRoute()
  }

  const principalStore = usePrincipalStore()
  const prepare: PrepareData = await principalStore.prepare()

  const serviceName:string[] = [];
  if (prepare.pluginServices && prepare.pluginServices.length <= 0) {
    serviceName.push(...prepare.pluginServices);
  }
  initialState.value = true

  return await loadRouter(serviceName)
}

const onBeforeEach: NavigationGuardWithThis<unknown> = async (to) => {
  // 获取认证状态
  const principalStore = usePrincipalStore()

  if (to.name === import.meta.env.VITE_APP_AUTH_PAGE_NAME) {
    const socketStore = useSocketStore()
    socketStore.disconnect()
    await principalStore.logout()
    clearRoute()
    return // 继续导航
  }

  // 仅在初始状态时尝试加载动态路由
  if (!initialState.value) {
    await reloadRoute()
    return {...to, replace: true}
  }

  const requiresAuth = (to.meta.requiresAuth || false) && !principalStore.isAuthenticated
  const requiresFullyAuth =
    (to.meta.requiresFullyAuth || false) && !principalStore.isFullyAuthenticated

  // 处理需要认证但未认证的请求
  if (requiresAuth || requiresFullyAuth) {
    sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_REQUEST_PATH_NAME, to.fullPath)
    return {
      name: import.meta.env.VITE_APP_AUTH_PAGE_NAME,
      query: {authenticationType: principalStore.state.type},
    }
  }

  useMenuPrincipalStore().setRouteEnterLoading(to.fullPath, true)
  // 默认继续导航
  return true
}

/**
 * 路由导航后置守卫：面包屑、路由进入 loading 清理
 */
const onAfterEach = (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  const menuPrincipalStore = useMenuPrincipalStore()
  menuPrincipalStore.resetCurrentBreadcrumbs(to, router)
  // 推迟一帧再清 loading，避免与 beforeEach 同一宏任务内立刻清掉，界面来不及绘制 tab 图标 spin
  nextTick(() => menuPrincipalStore.setRouteEnterLoading(to.fullPath, false))
}

/**
 * 添加导航卫士
 */
router.beforeEach(onBeforeEach)

/**
 * 注册路由后置守卫
 */
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
