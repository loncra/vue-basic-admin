import type {RouteRecordRaw} from 'vue-router'
import {RESOURCE_SERVER_DATA_DICTIONARY_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 数据字典相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/resource-server/dictionary',
    component: () => import('@/views/resource-server/dictionary/Home.vue'),
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      requiresAuth: true,
      single: true,
    },
  },
  {
    path: '/resource-server/dictionary/addChild',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.ADD_CHILD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      icon: 'loncra-list-tree',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/edit',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/add',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      icon: 'loncra-file-plus',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/detail',
    component: () => import('@/views/resource-server/data-dictionary/Detail.vue'),
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      icon: 'loncra-file-search',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
]

export default router
