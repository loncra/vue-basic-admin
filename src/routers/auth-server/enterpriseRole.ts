import type {RouteRecordRaw} from 'vue-router'
import {AUTH_SERVER_ENTERPRISE_ROLE_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 企业角色相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/auth-server/enterprise/role',
    component: () => import('@/views/auth-server/enterprise-role/Home.vue'),
    name: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/auth-server/enterprise/role/addChild',
    component: () => import('@/views/auth-server/enterprise-role/Form.vue'),
    name: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.ADD_CHILD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-list-tree',
      parent: '/auth-server/enterprise/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/enterprise/role/edit',
    component: () => import('@/views/auth-server/enterprise-role/Form.vue'),
    name: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/auth-server/enterprise/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/enterprise/role/add',
    component: () => import('@/views/auth-server/enterprise-role/Form.vue'),
    name: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-plus',
      parent: '/auth-server/enterprise/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/enterprise/role/detail',
    component: () => import('@/views/auth-server/enterprise-role/Detail.vue'),
    name: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AUTH_SERVER,
      icon: 'loncra-file-search',
      parent: '/auth-server/enterprise/role',
      requiresAuth: true,
    },
  },
]

export default router
