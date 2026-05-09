import type {RouteRecordRaw} from 'vue-router'

/** 控制台用户管理相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/user/console',
    component: () => import('@/views/auth-server/console-user/Home.vue'),
    name: 'auth_server_user_console',
    meta: {
      applicationName: 'auth-server',
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/user/console/edit',
    component: () => import('@/views/auth-server/console-user/Form.vue'),
    name: 'auth_server_console_user_edit',
    meta: {
      applicationName: 'auth-server',
      title: '编辑员工',
      icon: 'icon-edit',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/user/console/detail',
    component: () => import('@/views/auth-server/console-user/Detail.vue'),
    name: 'auth_server_console_user_detail',
    meta: {
      applicationName: 'auth-server',
      title: '员工明细',
      icon: 'icon-order-inspection',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
]

export default router
