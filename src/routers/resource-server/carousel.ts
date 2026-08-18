import type {RouteRecordRaw} from 'vue-router'
import {RESOURCE_SERVER_CAROUSEL_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 数据字典相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/resource-server/carousel',
    component: () => import('@/views/resource-server/carousel/Home.vue'),
    name: RESOURCE_SERVER_CAROUSEL_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      requiresAuth: true,
      single: true,
    },
  },
  {
    path: '/resource-server/carousel/edit',
    component: () => import('@/views/resource-server/carousel/Form.vue'),
    name: RESOURCE_SERVER_CAROUSEL_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/resource-server/carousel',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/carousel/add',
    component: () => import('@/views/resource-server/carousel/Form.vue'),
    name: RESOURCE_SERVER_CAROUSEL_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      icon: 'loncra-file-plus',
      parent: '/resource-server/carousel',
      requiresFullyAuth: true,
    },
  }
]

export default router
