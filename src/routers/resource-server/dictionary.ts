import type {RouteRecordRaw} from 'vue-router'

/** 数据字典相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/resource-server/dictionary',
    component: () => import('@/views/resource-server/dictionary/Home.vue'),
    name: 'resource_server_dictionary',
    meta: {
      applicationName: 'resource-server',
      requiresAuth: true,
      single: true,
    },
  },
  {
    path: '/resource-server/dictionary/addChild',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: 'resource_server_data_dictionary_add_child',
    meta: {
      applicationName: 'resource-server',
      icon: 'loncra-list-tree',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/edit',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: 'resource_server_data_dictionary_edit',
    meta: {
      dynamicTitle: true,
      applicationName: 'resource-server',
      icon: 'loncra-file-pen-line',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/add',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: 'resource_server_data_dictionary_add',
    meta: {
      applicationName: 'resource-server',
      icon: 'loncra-file-plus',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/detail',
    component: () => import('@/views/resource-server/data-dictionary/Detail.vue'),
    name: 'resource_server_data_dictionary_detail',
    meta: {
      dynamicTitle: true,
      applicationName: 'resource-server',
      icon: 'loncra-file-search',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
]

export default router
