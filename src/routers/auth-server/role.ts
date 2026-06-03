import type {RouteRecordRaw} from 'vue-router'

/** 角色相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/role',
    component: () => import('@/views/auth-server/role/Home.vue'),
    name: 'auth_server_role',
    meta: {
      applicationName: 'auth-server',
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/role/addChild',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: 'auth_server_role_add_child',
    meta: {
      applicationName: 'auth-server',
      icon: 'loncra-list-tree',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/edit',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: 'auth_server_role_edit',
    meta: {
      dynamicTitle: true,
      applicationName: 'auth-server',
      icon: 'loncra-file-pen-line',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/add',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: 'auth_server_role_add',
    meta: {
      applicationName: 'auth-server',
      icon: 'loncra-file-plus',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/detail',
    component: () => import('@/views/auth-server/role/Detail.vue'),
    name: 'auth_server_role_detail',
    meta: {
      dynamicTitle: true,
      applicationName: 'auth-server',
      icon: 'loncra-file-search',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
]

export default router
