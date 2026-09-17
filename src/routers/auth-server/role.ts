import type {RouteRecordRaw} from 'vue-router'
import {SYSTEM_MODULE_NAME} from '@loncra/client/commons'

/**
 * 角色模块的路由名。
 * 就近放在路由模块里：与 path/meta/component 同处一地，页面（role.page.ts）从这里引，
 * 不再经 `constants/` 转发。
 */
export const AUTH_SERVER_ROLE_ROUTE = {
  HOME: 'auth_server_role',
  ADD_CHILD: 'auth_server_role_add_child',
  EDIT: 'auth_server_role_edit',
  ADD: 'auth_server_role_add',
  DETAIL: 'auth_server_role_detail',
} as const

/** 角色相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/role',
    component: () => import('@/views/auth-server/role/Home.vue'),
    name: AUTH_SERVER_ROLE_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/role/addChild',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: AUTH_SERVER_ROLE_ROUTE.ADD_CHILD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-list-tree',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/edit',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: AUTH_SERVER_ROLE_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/add',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: AUTH_SERVER_ROLE_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-plus',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/detail',
    component: () => import('@/views/auth-server/role/Detail.vue'),
    name: AUTH_SERVER_ROLE_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
]

export default router
