import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_RESOURCE_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 权限相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/resource',
    component: () => import('@/views/auth-server/resource/Home.vue'),
    name: AUTH_SERVER_RESOURCE_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/resource/addChild',
    component: () => import('@/views/auth-server/resource/Form.vue'),
    name: AUTH_SERVER_RESOURCE_ROUTE.ADD_CHILD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-list-tree',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/edit',
    component: () => import('@/views/auth-server/resource/Form.vue'),
    name: AUTH_SERVER_RESOURCE_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/add',
    component: () => import('@/views/auth-server/resource/Form.vue'),
    name: AUTH_SERVER_RESOURCE_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-plus',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/detail',
    component: () => import('@/views/auth-server/resource/Detail.vue'),
    name: AUTH_SERVER_RESOURCE_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
]

export default router
