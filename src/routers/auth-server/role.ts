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
    path: '/auth-server/role/edit',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: 'auth_server_role_edit',
    meta: {
      applicationName: 'auth-server',
      title: '编辑角色',
      icon: 'icon-edit',
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
      title: '添加角色',
      icon: 'icon-add',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/detail',
    component: () => import('@/views/auth-server/role/Detail.vue'),
    name: 'auth_server_role_detail',
    meta: {
      applicationName: 'auth-server',
      title: '角色明细',
      icon: 'icon-order-inspection',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
]

export default router
