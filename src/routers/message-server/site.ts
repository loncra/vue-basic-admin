import type {RouteRecordRaw} from 'vue-router'

/** 短信消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/site',
    component: () => import('@/views/message-server/site/Home.vue'),
    name: 'message_server_site',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true
    },
  },{
    path: '/message-server/site/send',
    component: () => import('@/views/message-server/site/Send.vue'),
    name: 'message_server_site_send',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true,
      icon: 'icon-send-fill',
      parent: '/message-server/site',
      requiresFullyAuth: true,
    },
  }
]

export default router
