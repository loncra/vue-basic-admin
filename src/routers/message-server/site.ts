import type {RouteRecordRaw} from 'vue-router'
import {MESSAGE_SERVER_SITE_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 短信消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/site',
    component: () => import('@/views/message-server/site/Home.vue'),
    name: MESSAGE_SERVER_SITE_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true
    },
  },{
    path: '/message-server/site/send',
    component: () => import('@/views/message-server/site/Send.vue'),
    name: MESSAGE_SERVER_SITE_ROUTE.SEND,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon: 'loncra-send',
      parent: '/message-server/site',
      requiresFullyAuth: true,
    },
  },{
    path: '/message-server/site/detail',
    component: () => import('@/views/message-server/site/Detail.vue'),
    name: MESSAGE_SERVER_SITE_ROUTE.DETAIL,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon: 'loncra-file-search',
      parent: '/message-server/site',
      requiresFullyAuth: true,
    },
  }
]

export default router
