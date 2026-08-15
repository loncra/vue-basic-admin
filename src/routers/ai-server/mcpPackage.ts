import type {RouteRecordRaw} from 'vue-router'
import {MCP_PACKAGE_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

const router: RouteRecordRaw[] = [
  {
    path: '/ai-server/ai/mcp/package',
    component: () => import('@/views/ai-server/mcp-package/Home.vue'),
    name: MCP_PACKAGE_ROUTE.HOME,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      requiresAuth: true,
    },
  },
  {
    path: '/ai-server/ai/mcp/package/edit',
    component: () => import('@/views/ai-server/mcp-package/Form.vue'),
    name: MCP_PACKAGE_ROUTE.EDIT,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-pen-line',
      parent: '//ai-server/ai/mcp/package',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/ai-server/ai/mcp/package/add',
    component: () => import('@/views/ai-server/mcp-package/Form.vue'),
    name: MCP_PACKAGE_ROUTE.ADD,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-plus',
      parent: '/ai-server/ai/mcp/package',
      requiresFullyAuth: true,
    },
  },
  {
    path: '/ai-server/ai/mcp/package/detail',
    component: () => import('@/views/ai-server/mcp-package/Detail.vue'),
    name: MCP_PACKAGE_ROUTE.DETAIL,
    meta: {
      dynamicTitle: true,
      applicationName: SYSTEM_MODULE_NAME.AI_SERVER,
      icon: 'loncra-file-search',
      parent: '/ai-server/mcp/package',
      requiresFullyAuth: true,
    },
  },
]

export default router
