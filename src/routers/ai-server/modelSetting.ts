import type {RouteRecordRaw} from 'vue-router'

/** AI 模型配置相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/ai-server/model/setting',
    component: () => import('@/views/ai-server/model-setting/Home.vue'),
    name: 'ai_server_model_setting',
    meta: {
      applicationName: 'ai-server',
      requiresAuth: true,
    },
  },
  {
    path: '/ai-server/model/setting/edit',
    component: () => import('@/views/ai-server/model-setting/Form.vue'),
    name: 'ai_server_model_setting_edit',
    meta: {
      dynamicTitle: true,
      applicationName: 'ai-server',
      icon: 'loncra-file-pen-line',
      parent: '/ai-server/model/setting',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/ai-server/model/setting/add',
    component: () => import('@/views/ai-server/model-setting/Form.vue'),
    name: 'ai_server_model_setting_add',
    meta: {
      applicationName: 'ai-server',
      icon: 'loncra-file-plus',
      parent: '/ai-server/model/setting',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/ai-server/model/setting/detail',
    component: () => import('@/views/ai-server/model-setting/Detail.vue'),
    name: 'ai_server_model_setting_detail',
    meta: {
      dynamicTitle: true,
      applicationName: 'ai-server',
      icon: 'loncra-file-search',
      parent: '/ai-server/model/setting',
      requiresFullyAuth: true,
    },
  },
]

export default router
