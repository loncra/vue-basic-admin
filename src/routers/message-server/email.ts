import type {RouteRecordRaw} from 'vue-router'
import {MESSAGE_SERVER_EMAIL_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 短信消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/email',
    component: () => import('@/views/message-server/email/Home.vue'),
    name: MESSAGE_SERVER_EMAIL_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true
    },
  },{
    path: '/message-server/email/send',
    component: () => import('@/views/message-server/email/Send.vue'),
    name: MESSAGE_SERVER_EMAIL_ROUTE.SEND,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon: 'loncra-send',
      parent: '/message-server/email',
      requiresFullyAuth: true,
    },
  },{
    path: '/message-server/email/detail',
    component: () => import('@/views/message-server/email/Detail.vue'),
    name: MESSAGE_SERVER_EMAIL_ROUTE.DETAIL,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon: 'loncra-file-search',
      parent: '/message-server/email',
      requiresFullyAuth: true,
    },
  }
]

export default router
