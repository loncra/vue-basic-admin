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
    name: 'auth_server_resource_addChild',
    meta: {
      applicationName: 'auth-server',
      title: '添加权限子级',
      icon: 'icon-editor-add-cell',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/edit',
    component: () => import('@/views/auth-server/resource/Form.vue'),
    name: 'auth_server_resource_edit',
    meta: {
      applicationName: 'auth-server',
      title: '编辑权限',
      icon: 'icon-edit',
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
      title: '添加权限',
      icon: 'icon-add',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/resource/detail',
    component: () => import('@/views/auth-server/resource/Detail.vue'),
    name: 'auth_server_resource_detail',
    meta: {
      applicationName: 'auth-server',
      title: '权限明细',
      icon: 'icon-order-inspection',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
]

export default router
