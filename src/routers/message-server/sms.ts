import type {RouteRecordRaw} from 'vue-router'

/** 短信消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/sms',
    component: () => import('@/views/message-server/sms/Home.vue'),
    name: 'message_server_sms',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true
    },
  },{
    path: '/message-server/sms/template',
    component: () => import('@/views/message-server/sms/template/Home.vue'),
    name: 'message_server_sms_template',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true,
      icon:'icon-template'
    },
  },{
    path: '/message-server/sms/sign',
    component: () => import('@/views/message-server/sms/sign/Home.vue'),
    name: 'message_server_sms_sign',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true,
      icon:'icon-flag'
    },
  },{
    path: '/message-server/sms/send',
    component: () => import('@/views/message-server/sms/Send.vue'),
    name: 'message_server_sms_send',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true,
      icon: 'icon-send-fill',
      parent: '/message-server/sms',
      requiresFullyAuth: true,
    },
  },{
    path: '/message-server/sms/detail',
    component: () => import('@/views/message-server/sms/Detail.vue'),
    name: 'message_server_sms_detail',
    meta: {
      applicationName: 'message-server',
      requiresAuth: true,
      icon: 'icon-order-inspection',
      parent: '/message-server/sms',
      requiresFullyAuth: true,
    },
  }
]

export default router
