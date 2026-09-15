import type {
  NavigationGuardWithThis,
  RouteLocationNormalized,
  RouteRecordName,
  RouteRecordRaw
} from 'vue-router'
import {createRouter, createWebHistory} from 'vue-router'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import type {ResourceEntity} from "@loncra/client/auth";
import {AUTH_SERVER_AUTHENTICATION_TYPE, AUTH_SERVER_RESOURCE_TYPE} from '@loncra/client/auth'
import type {RouteTitleGetter, RouteTitleMap, RouteTitleParams} from "@/types/composables";
import {AUTHENTICATION_MEMBER_TYPE, RESOURCE_SERVER_USER_EXPORT_ROUTE} from '@/constants';
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {nextTick, ref, watch} from 'vue'
import {unmergeTree} from '@loncra/client/commons'

import Auth from '@/views/Auth.vue'
import Home from '@/views/Home.vue'
import Workbench from '@/views/common/Workbench.vue'
import UserExport from "@/views/common/UserExport.vue";
import MyMessage from '@/views/common/MyMessage.vue'
import Setting from '@/views/common/Setting.vue'
import NotFound from '@/views/error/NotFound.vue';
import Forbidden from '@/views/error/Forbidden.vue';
import BadRequest from '@/views/error/BadRequest.vue';
import ForgotPassword from '@/views/ForgotPassword.vue';

import MySiteMessage from "@/views/common/my/MySiteMessage.vue";
import MyChatMessage from "@/views/common/my/MyChatMessage.vue";

import Agent from "@/views/common/AiAgent.vue";

import i18n from '@/i18n'
import {useSocketStore} from "@/stores/socketStore.ts";
import {useBootstrapStore} from "@/stores/bootstrapStore.ts";

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
      quickAccess:false,
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
      quickAccess:false,
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
    name: RESOURCE_SERVER_USER_EXPORT_ROUTE,
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
    path: '/commons/agent',
    name: 'agent',
    component: Agent,
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
    path: '/' + import.meta.env.VITE_APP_AUTH_PAGE_NAME + '/:authenticationType(console|personal)?',
    name: import.meta.env.VITE_APP_AUTH_PAGE_NAME,
    component: Auth
  },
  {
    // 忘记密码路由
    path: '/forgot/password',
    name: 'forgot_password',
    component: ForgotPassword
  },
  {
    path: '/error/404',
    name: '404',
    component: NotFound,
    meta:{
      quickAccess:false,
    }
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
    name: 'not_found',
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
 * 清除所有动态路由并重新添加基础路由
 * 用于登录 / 登出 / 切换企业后重建路由表
 */
export const clearDynamicRoutes = (): void => {
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
    // 目录的 index.ts 只是聚合导出，不是路由定义
    if (key.endsWith('/index.ts')) {
      continue
    }
    // 未指定服务 ⇒ 只保留核心路由（不再全量加载）
    if (!serviceName.some(path => key.includes(path))) {
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

/**
 * 按后端已启动的服务装配动态路由。
 * 服务未启动 ⇒ 对应目录下的路由模块不注册，访问时走 404。
 */
export const registerServiceRoutes = async (serviceName: string[]): Promise<RouteRecordRaw[]> => {
  const importRoutes: RouteRecordRaw[] = await loadServiceRoutes(serviceName)
  importRoutes.forEach((route) => router.addRoute(import.meta.env.VITE_APP_HOME_PAGE_NAME, route))
  initialState.value = true
  return importRoutes
}

/**
 * 拉取当前用户的菜单资源并合并进路由 meta（标题 / 图标 / 所属应用）。
 * 仅应在已认证时调用，避免未登录时 401 与启动流程抢方向盘。
 */
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
    name: import.meta.env.VITE_APP_AUTH_PAGE_NAME,
    params: {
      authenticationType:(authenticationType).toLowerCase(),
    },
  }
}

const onBeforeEach: NavigationGuardWithThis<unknown> = async (to) => {
  // 获取认证状态
  const principalStore = usePrincipalStore()
  const socketStore = useSocketStore()
  const menuPrincipalStore = useMenuPrincipalStore()

  if (to.name === import.meta.env.VITE_APP_AUTH_PAGE_NAME) {
    socketStore.disconnect()
    await principalStore.logout()
    clearDynamicRoutes()
    menuPrincipalStore.reset()
    return // 继续导航
  } else if (routes.some(route => route.name === to.name)) {
    return
  }

  // 首次导航发生在路由装配之前，等启动管线结束再判鉴权，否则会误判为未登录而闪登录页
  await useBootstrapStore().waitReady()

  const requiresAuth = (to.meta.requiresAuth || false) && !principalStore.isAuthenticated
  const requiresFullyAuth =
    (to.meta.requiresFullyAuth || false) && !principalStore.isFullyAuthenticated

  // 处理需要认证但未认证的请求
  if (requiresAuth || requiresFullyAuth) {
    return saveRequestPathThenToAuth(to.fullPath, String(to.meta.authenticationType || principalStore.state.type))
  }

  if (principalStore.isAuthenticated) {
    socketStore.ensureConnected()
  }

  menuPrincipalStore.setRouteEnterLoading(to.fullPath, true)
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
