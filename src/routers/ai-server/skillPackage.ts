import type {RouteRecordRaw} from 'vue-router'
import {SKILL_PACKAGE_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

const router: RouteRecordRaw[] = [
  {
    path: '/ai-server/ai/skill/package',
    component: () => import('@/views/ai-server/skill-package/Home.vue'),
    name: SKILL_PACKAGE_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/ai-server/ai/skill/package/edit',
    component: () => import('@/views/ai-server/skill-package/Form.vue'),
    name: SKILL_PACKAGE_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '/ai-server/ai/skill/package',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/ai-server/ai/skill/package/add',
    component: () => import('@/views/ai-server/skill-package/Form.vue'),
    name: SKILL_PACKAGE_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-plus',
      parent: '/ai-server/ai/skill/package',
      requiresFullyAuth: true,
    },
  },
]

export default router
