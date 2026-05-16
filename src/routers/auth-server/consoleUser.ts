import type {RouteRecordRaw} from 'vue-router'
import i18n from "@/i18n";

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
      title: i18n.global.t('common.edit', {name:' ' + i18n.global.t('authServer.consoleUser.routePage')}),
      icon: 'icon-edit',
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
      title: i18n.global.t('common.add', {name:' ' + i18n.global.t('authServer.consoleUser.routePage')}),
      icon: 'icon-add',
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
      title: i18n.global.t('common.detail', {name:i18n.global.t('authServer.consoleUser.routePage') + ' '}),
      icon: 'icon-order-inspection',
      parent: '/auth-server/user/console',
      requiresFullyAuth: true,
    },
  },
]

export default router
