import type {RouteRecordRaw} from 'vue-router'
import i18n from "@/i18n";

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
      title: i18n.global.t('common.addChild', {name:' ' + i18n.global.t('authServer.resource.routePage') + ' '}),
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
      title: i18n.global.t('common.edit', {name:' ' + i18n.global.t('authServer.resource.routePage')}),
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
      title: i18n.global.t('common.add', {name:' ' + i18n.global.t('authServer.resource.routePage')}),
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
      title: i18n.global.t('common.detail', {name:i18n.global.t('authServer.resource.routePage') + ' '}),
      icon: 'icon-order-inspection',
      parent: '/auth-server/resource',
      requiresFullyAuth: true,
    },
  },
]

export default router
