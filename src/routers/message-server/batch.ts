import type {RouteRecordRaw} from 'vue-router'

/** 批量消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/batch',
    component: () => import('@/views/message-server/batch/Home.vue'),
    name: 'message_server_batch',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true
    },
  },
  {
    path: '/auth-server/batch/detail',
    component: () => import('@/views/message-server/batch/Detail.vue'),
    name: 'message_server_batch_detail',
    meta: {
      dynamicTitle: true,
      applicationName: 'message-server',
      icon: 'icon-order-inspection',
      parent: '/message-server/batch',
      requiresFullyAuth: true,
    },
  },
]

export default router
