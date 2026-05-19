import type {RouteRecordRaw} from 'vue-router'

/** 数据字典相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/resource-server/carousel',
    component: () => import('@/views/resource-server/carousel/Home.vue'),
    name: 'resource_server_carousel',
    meta: {
      applicationName: 'resource-server',
      requiresAuth: true,
      single: true,
    },
  },
  {
    path: '/resource-server/carousel/edit',
    component: () => import('@/views/resource-server/carousel/Form.vue'),
    name: 'resource_server_carousel_edit',
    meta: {
      dynamicTitle: true,
      applicationName: 'resource-server',
      icon: 'icon-edit',
      parent: '/resource-server/carousel',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/carousel/add',
    component: () => import('@/views/resource-server/carousel/Form.vue'),
    name: 'resource_server_carousel_add',
    meta: {
      applicationName: 'resource-server',
      icon: 'icon-add',
      parent: '/resource-server/carousel',
      requiresFullyAuth: true,
    },
  }
]

export default router
