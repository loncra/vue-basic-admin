import type {RouteRecordRaw} from 'vue-router'
import {MESSAGE_SERVER_BATCH_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 批量消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/batch',
    component: () => import('@/views/message-server/batch/Home.vue'),
    name: MESSAGE_SERVER_BATCH_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true
    },
  },
  {
    path: '/auth-server/batch/detail',
    component: () => import('@/views/message-server/batch/Detail.vue'),
    name: MESSAGE_SERVER_BATCH_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      icon: 'loncra-file-search',
      parent: '/message-server/batch',
      requiresFullyAuth: true,
    },
  },
]

export default router
