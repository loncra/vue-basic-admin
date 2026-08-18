import type {RouteRecordRaw} from 'vue-router'
import {AI_SERVER_MODEL_SETTING_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** AI 模型配置相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/ai-server/model/setting',
    component: () => import('@/views/ai-server/model-setting/Home.vue'),
    name: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/ai-server/model/setting/edit',
    component: () => import('@/views/ai-server/model-setting/Form.vue'),
    name: AI_SERVER_MODEL_SETTING_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/ai-server/model/setting',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/ai-server/model/setting/add',
    component: () => import('@/views/ai-server/model-setting/Form.vue'),
    name: AI_SERVER_MODEL_SETTING_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-plus',
      parent: '/ai-server/model/setting',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/ai-server/model/setting/detail',
    component: () => import('@/views/ai-server/model-setting/Detail.vue'),
    name: AI_SERVER_MODEL_SETTING_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-search',
      parent: '/ai-server/model/setting',
      requiresFullyAuth: true,
    },
  },
]

export default router
