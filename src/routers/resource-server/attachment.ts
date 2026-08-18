import type {RouteRecordRaw} from 'vue-router'
import {RESOURCE_SERVER_ATTACHMENT_ROUTE, SYSTEM_MODULE_NAME} from '@/constants'

/** 附件管理相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/resource-server/file/manager',
    component: () => import('@/views/resource-server/attachement/FileManagerHome.vue'),
    name: RESOURCE_SERVER_ATTACHMENT_ROUTE.FILE_MANAGER,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      requiresAuth: true,
      single: true,
    },
  },{
    path: '/resource-server/my/resource',
    component: () => import('@/views/resource-server/attachement/MyResourceHome.vue'),
    name: RESOURCE_SERVER_ATTACHMENT_ROUTE.MY_RESOURCE,
    meta: {
      applicationName: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      requiresAuth: true,
      single: true,
    },
  },
]

export default router
