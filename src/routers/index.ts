import type {NavigationGuardWithThis, RouteLocationNormalized, RouteRecordRaw} from 'vue-router'
import {createRouter, createWebHistory} from 'vue-router'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import Auth from '@/views/Auth.vue'
import Home from '@/views/Home.vue'
import Workbench from '@/views/commons/Workbench.vue'
import Setting from '@/views/commons/Setting.vue'

/**
 * 首页的子路由配置
 * 这些路由会作为 Home 组件的子路由显示
 */
const childrenRoutes: RouteRecordRaw[] = [
  {
    path: '/commons/workbench',
    name: import.meta.env.VITE_APP_HOME_ROUTE_PAGE_NAME,
    component: Workbench,
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
      title: '工作台',
      fixed: true,
      sort: 0,
      icon: 'icon-sign-board',
    },
  },
  {
    path: '/commons/setting',
    name: 'setting',
    component: Setting,
    meta: {
      applicationName: 'commons',
      requiresAuth: true,
      title: '系统设置',
      icon: 'icon-setting',
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
    redirect: { name: import.meta.env.VITE_APP_HOME_ROUTE_PAGE_NAME },
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
    // 首页路由，包含子路由
    path: '/' + import.meta.env.VITE_APP_HOME_PAGE_NAME,
    name: import.meta.env.VITE_APP_HOME_PAGE_NAME,
    component: Home,
    children: childrenRoutes,
    meta: {
      title: '首页',
    },
  },
]

/**
 * 创建 Vue Router 实例
 * 使用 HTML5 History 模式
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

const onBeforeEach: NavigationGuardWithThis<unknown> = async (to) => {
  // 获取认证状态
  const principalStore = usePrincipalStore()
  const requiresAuth = (to.meta.requiresAuth || false) && !principalStore.isAuthenticated
  const requiresFullyAuth =
    (to.meta.requiresFullyAuth || false) && !principalStore.isFullyAuthenticated

  // 处理需要认证但未认证的请求
  if (requiresAuth || requiresFullyAuth) {
    sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_REQUEST_PATH_NAME, to.fullPath)
    return {
      name: import.meta.env.VITE_APP_AUTH_PAGE_NAME,
      query: { authenticationType: principalStore.state.type },
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
