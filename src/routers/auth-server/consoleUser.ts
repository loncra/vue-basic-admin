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
      dynamicTitle: true,
      applicationName: 'auth-server',
      icon: 'loncra-file-pen-line',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/user/console/add',
    component: () => import('@/views/auth-server/console-user/Form.vue'),
    name: 'auth_server_console_user_add',
    meta: {
      applicationName: 'auth-server',
      icon: 'loncra-file-plus',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/user/console/detail',
    component: () => import('@/views/auth-server/console-user/Detail.vue'),
    name: 'auth_server_console_user_detail',
    meta: {
      dynamicTitle: true,
      applicationName: 'auth-server',
      icon: 'loncra-file-search',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
]

export default router
