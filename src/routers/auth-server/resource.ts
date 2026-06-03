import type {RouteRecordRaw} from 'vue-router'

/** 权限相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/resource',
    component: () => import('@/views/auth-server/resource/Home.vue'),
    name: 'auth_server_resource',
    meta: {
      applicationName: 'auth-server',
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/resource/addChild',
    component: () => import('@/views/auth-server/resource/Form.vue'),
    name: 'auth_server_resource_add_child',
    meta: {
      applicationName: 'auth-server',
      icon: 'loncra-list-tree',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/edit',
    component: () => import('@/views/auth-server/resource/Form.vue'),
    name: 'auth_server_resource_edit',
    meta: {
      dynamicTitle: true,
      applicationName: 'auth-server',
      icon: 'loncra-file-pen-line',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/add',
    component: () => import('@/views/auth-server/resource/Form.vue'),
    name: 'auth_server_resource_add',
    meta: {
      applicationName: 'auth-server',
      icon: 'loncra-file-plus',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/detail',
    component: () => import('@/views/auth-server/resource/Detail.vue'),
    name: 'auth_server_resource_detail',
    meta: {
      dynamicTitle: true,
      applicationName: 'auth-server',
      icon: 'loncra-file-search',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
]

export default router
