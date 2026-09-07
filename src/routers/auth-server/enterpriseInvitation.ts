import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 企业邀请相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/enterprise/invitation',
    component: () => import('@/views/auth-server/enterprise-invitation/Home.vue'),
    name: AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/enterprise/invitation/detail',
    component: () => import('@/views/auth-server/enterprise-invitation/Detail.vue'),
    name: AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/enterprise/invitation',
      requiresAuth: true,
    },
  },
]

export default router
