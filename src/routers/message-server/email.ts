import type {RouteRecordRaw} from 'vue-router'

/** 短信消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/email',
    component: () => import('@/views/message-server/email/Home.vue'),
    name: 'message_server_email',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true
    },
  },{
    path: '/message-server/email/send',
    component: () => import('@/views/message-server/email/Send.vue'),
    name: 'message_server_email_send',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true,
      icon: 'icon-send-fill',
      parent: '/message-server/email',
      requiresFullyAuth: true,
    },
  },{
    path: '/message-server/email/detail',
    component: () => import('@/views/message-server/email/Detail.vue'),
    name: 'message_server_email_detail',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true,
      icon: 'icon-order-inspection',
      parent: '/message-server/email',
      requiresFullyAuth: true,
    },
  }
]

export default router
