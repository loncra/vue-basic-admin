import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 审计事件相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/audit/event/authentication',
    component: () => import('@/views/auth-server/audit-event/AuthenticationHome.vue'),
    name: AUTH_SERVER_AUDIT_EVENT_ROUTE.AUTHENTICATION,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/audit/event/operationDataTrace',
    component: () => import('@/views/auth-server/audit-event/OperationDataTraceHome.vue'),
    name: AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/audit/event/authentication/detail',
    component: () => import('@/views/auth-server/audit-event/Detail.vue'),
    name: AUTH_SERVER_AUDIT_EVENT_ROUTE.AUTHENTICATION_DETAIL,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/audit/event/authentication',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/audit/event/operationDataTrace/detail',
    component: () => import('@/views/auth-server/audit-event/Detail.vue'),
    name: AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE_DETAIL,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/audit/event/operationDataTrace',
      requiresFullyAuth: true,
    },
  },
]

export default router
