import type {RouteRecordRaw} from 'vue-router'
import i18n from "@/i18n";

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
    name: 'auth_server_role_addChild',
    meta: {
      applicationName: 'auth-server',
      title: i18n.global.t('common.addChild', {name:' ' + i18n.global.t('authServer.role.routePage') + ' '}),
      icon: 'icon-editor-add-cell',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/auth-server/role/edit',
    component: () => import('@/views/auth-server/role/Form.vue'),
    name: 'auth_server_role_edit',
    meta: {
      applicationName: 'auth-server',
      title: i18n.global.t('common.edit', {name:' ' + i18n.global.t('authServer.role.routePage')}),
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
      title: i18n.global.t('common.edit', {name:' ' + i18n.global.t('authServer.role.routePage')}),
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
      title: i18n.global.t('common.detail', {name:i18n.global.t('authServer.role.routePage') + ' '}),
      icon: 'icon-order-inspection',
      parent: '/auth-server/role',
      requiresFullyAuth: true,
    },
  },
]

export default router
