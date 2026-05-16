import type {RouteRecordRaw} from 'vue-router'
import i18n from '@/i18n'

/** 权限相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/audit/event/authentication',
    component: () => import('@/views/auth-server/audit-event/AuthenticationHome.vue'),
    name: 'auth_server_audit_event_authentication',
    meta: {
      applicationName: 'auth-server',
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/audit/event/operationDataTrace',
    component: () => import('@/views/auth-server/audit-event/OperationDataTraceHome.vue'),
    name: 'auth_server_audit_event_operation_data_trace',
    meta: {
      applicationName: 'auth-server',
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/audit/event/authentication/detail',
    component: () => import('@/views/auth-server/audit-event/Detail.vue'),
    name: 'auth_server_audit_event_authentication_detail',
    meta: {
      applicationName: 'auth-server',
      title: i18n.global.t('common.detail', {name:i18n.global.t('auth.log')}),
      icon: 'icon-order-inspection',
      parent: '/auth-server/audit/event/authentication',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/audit/event/operationDataTrace/detail',
    component: () => import('@/views/auth-server/audit-event/Detail.vue'),
    name: 'auth_server_audit_event_operation_data_trace_detail',
    meta: {
      applicationName: 'auth-server',
      title: i18n.global.t('common.detail', {name:i18n.global.t('form.operationDataTrace')}),
      icon: 'icon-order-inspection',
      parent: '/auth-server/audit/event/operationDataTrace',
      requiresFullyAuth: true,
    },
  },
]

export default router
