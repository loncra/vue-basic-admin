import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_ENTERPRISE_ROUTE} from '@/constants'
import {SYSTEM_MODULE_NAME} from '@loncra/client/commons'

const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/enterprise',
    component: () => import('@/views/auth-server/enterprise/Home.vue'),
    name: AUTH_SERVER_ENTERPRISE_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/enterprise/detail',
    component: () => import('@/views/auth-server/enterprise/Detail.vue'),
    name: AUTH_SERVER_ENTERPRISE_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/enterprise',
      requiresAuth: true,
    },
  },
]

export default router
