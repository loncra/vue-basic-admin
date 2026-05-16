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
    name: 'resource_server_data_dictionary_addChild',
    meta: {
      applicationName: 'resource-server',
      icon: 'icon-editor-add-cell',
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
      icon: 'icon-edit',
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
      icon: 'icon-add',
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
      icon: 'icon-order-inspection',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
]

export default router
