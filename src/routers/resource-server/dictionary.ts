import type {RouteRecordRaw} from 'vue-router'

import i18n from '@/i18n'

/** 权限相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/resource-server/dictionary',
    component: () => import('@/views/resource-server/dictionary/Home.vue'),
    name: 'resource_server_dictionary',
    meta: {
      applicationName: 'resource-server',
      requiresAuth: true,
      single: true,
    },
  },
  {
    path: '/resource-server/dictionary/addChild',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: 'resource_server_data_dictionary_addChild',
    meta: {
      applicationName: 'resource-server',
      title: i18n.global.t('common.addChild', {name:' ' + i18n.global.t('resourceServer.dataDictionary.routePage') + ' '}),
      icon: 'icon-editor-add-cell',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/edit',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: 'resource_server_data_dictionary_edit',
    meta: {
      applicationName: 'resource-server',
      title: i18n.global.t('common.edit', {name:' ' + i18n.global.t('resourceServer.dataDictionary.routePage')}),
      icon: 'icon-edit',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/resource-server/dictionary/add',
    component: () => import('@/views/resource-server/data-dictionary/Form.vue'),
    name: 'resource_server_data_dictionary_add',
    meta: {
      applicationName: 'resource-server',
      title: i18n.global.t('common.add', {name:' ' + i18n.global.t('resourceServer.dataDictionary.routePage')}),
      icon: 'icon-add',
      parent: '/resource-server/dictionary',
      requiresFullyAuth: true,
    },
  },
]

export default router
