import type {
  NavigationGuardWithThis,
  RouteLocationNormalized,
  RouteMeta,
  RouteRecordRaw
} from 'vue-router'
import {createRouter, createWebHistory} from 'vue-router'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import type {PrepareData, ResourceEntity} from "@/types";
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {ref} from 'vue'
import {findFirstTreeNode, requireNonNullOrUndefined} from '@/utils'

import Auth from '@/views/Auth.vue'
import Home from '@/views/Home.vue'
import Workbench from '@/views/commons/Workbench.vue'
import Setting from '@/views/commons/Setting.vue'
import NotFound from '@/views/error/NotFound.vue';
import Forbidden from '@/views/error/Forbidden.vue';
import BadRequest from '@/views/error/BadRequest.vue';

const initialState = ref<boolean>(false)

/**
 * 首页的子路由配置
 * 这些路由会作为 Home 组件的子路由显示
 */
const childrenRoutes: RouteRecordRaw[] = [
  {
    path: '403',
    name: '403',
    component: Forbidden,
    meta: {
      title: "没有权限访问"
    }
  },
  {
    path: '400',
    name: '400',
    component: BadRequest,
    meta: {
      title: "参数提交错误"
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
    path: '/commons/setting',
    name: 'setting',
    component: Setting,
    meta: {
      applicationName: 'commons',
      requiresAuth: true
    },
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
    component: Auth,
    meta: {
      title: '用户认证登录',
    },
  },
  {
    path: '/404',
    name: '404',
    component: NotFound,
    meta: {
      title: "找不到页面"
    }
  },
  {
    // 首页路由，包含子路由
    path: '/' + import.meta.env.VITE_APP_HOME_PAGE_NAME,
    name: import.meta.env.VITE_APP_HOME_PAGE_NAME,
    component: Home,
    children: childrenRoutes,
    meta: {
      title: '首页',
    },
  }/*,
  {
    path: "/:pathMatch(.*)*",
    name: 'NotFound',
    redirect: "/404"
  }*/
]

/**
 * 使用 Vite 的 glob 功能动态导入所有视图目录下的路由配置文件
 * 这些路由文件会在运行时按需加载
 */
const modules = import.meta.glob('@/routers/**/*.ts') as Record<
  string,
  () => Promise<{ default: RouteRecordRaw[] }>
>

/**
 * 创建 Vue Router 实例
 * 使用 HTML5 History 模式
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})


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
  const menuData = findFirstTreeNode<ResourceEntity>(
    m => route.path === m.page,
    menus,
  )
  if (!menuData) {
    return
  }
  const meta = requireNonNullOrUndefined<RouteMeta>(route.meta)
  if (!meta.title) {
    meta.title = menuData.name
  }
  if (!meta.applicationName) {
    meta.applicationName = menuData.applicationName
  }
  if (meta.icon) {
    menuData.icon = meta.icon as string
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
    RESOURCE_TYPE.PROFILE
  ])
  const menuRoutes = [...childrenRoutes, ...importRoutes]
  for (const route of menuRoutes) {
    applyRouteMetaToMenu(route, menus)
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
  // 默认继续导航
  return true
}

/**
 * 路由导航后置守卫
 * 当前暂未实现具体逻辑，预留用于后续扩展（如页面访问统计、埋点等）
 */
const onAfterEach = (to: RouteLocationNormalized) => {
  // TODO: 实现路由后置处理逻辑
}

/**
 * 添加导航卫士
 */
router.beforeEach(onBeforeEach)

/**
 * 注册路由后置守卫
 */
router.afterEach(onAfterEach)

export default router
