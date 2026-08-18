import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_CONSOLE_USER_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 控制台用户管理相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/user/console',
    component: () => import('@/views/auth-server/console-user/Home.vue'),
    name: AUTH_SERVER_CONSOLE_USER_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/user/console/edit',
    component: () => import('@/views/auth-server/console-user/Form.vue'),
    name: AUTH_SERVER_CONSOLE_USER_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/user/console/add',
    component: () => import('@/views/auth-server/console-user/Form.vue'),
    name: AUTH_SERVER_CONSOLE_USER_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-plus',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/user/console/detail',
    component: () => import('@/views/auth-server/console-user/Detail.vue'),
    name: AUTH_SERVER_CONSOLE_USER_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
]

export default router
