import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE} from '@/constants'
import {SYSTEM_MODULE_NAME} from '@loncra/client/commons'

const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/enterprise/member',
    component: () => import('@/views/auth-server/enterprise-member/Home.vue'),
    name: AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/enterprise/member/detail',
    component: () => import('@/views/auth-server/enterprise-member/Detail.vue'),
    name: AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/enterprise/member',
      requiresAuth: true,
    },
  },
]

export default router
