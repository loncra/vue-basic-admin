import type {RouteRecordRaw} from 'vue-router'
import {MESSAGE_SERVER_SMS_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 短信消息相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/message-server/sms',
    component: () => import('@/views/message-server/sms/Home.vue'),
    name: MESSAGE_SERVER_SMS_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true
    },
  },{
    path: '/message-server/sms/template',
    component: () => import('@/views/message-server/sms/template/Home.vue'),
    name: MESSAGE_SERVER_SMS_ROUTE.TEMPLATE,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon:'loncra-layout-template'
    },
  },{
    path: '/message-server/sms/sign',
    component: () => import('@/views/message-server/sms/sign/Home.vue'),
    name: MESSAGE_SERVER_SMS_ROUTE.SIGN,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon:'loncra-signature'
    },
  },{
    path: '/message-server/sms/send',
    component: () => import('@/views/message-server/sms/Send.vue'),
    name: MESSAGE_SERVER_SMS_ROUTE.SEND,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon: 'loncra-send',
      parent: '/message-server/sms',
      requiresFullyAuth: true,
    },
  },  {
    path: '/message-server/sms/detail',
    component: () => import('@/views/message-server/sms/Detail.vue'),
    name: MESSAGE_SERVER_SMS_ROUTE.DETAIL,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
      requiresAuth: true,
      icon: 'loncra-file-search',
      parent: '/message-server/sms',
      requiresFullyAuth: true,
    },
  }
]

export default router
