import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_PERSONAL_USER_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 个人用户管理相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/user/personal',
    component: () => import('@/views/auth-server/personal-user/Home.vue'),
    name: AUTH_SERVER_PERSONAL_USER_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/user/personal/detail',
    component: () => import('@/views/auth-server/personal-user/Detail.vue'),
    name: AUTH_SERVER_PERSONAL_USER_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/user/personal',
      requiresAuth: true,
    },
  },
]

export default router
