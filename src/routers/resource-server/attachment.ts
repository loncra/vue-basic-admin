import type {RouteRecordRaw} from 'vue-router'

/** 附件管理相关路由 */
const router: RouteRecordRaw[] = [
  {
    path: '/resource-server/file/manager',
    component: () => import('@/views/resource-server/attachement/FileManagerHome.vue'),
    name: 'resource_server_file_manager',
    meta: {
      applicationName: 'resource-server',
      requiresAuth: true,
      single: true,
    },
  },{
    path: '/resource-server/my/resource',
    component: () => import('@/views/resource-server/attachement/MyResourceHome.vue'),
    name: 'resource_server_my_resource',
    meta: {
      applicationName: 'resource-server',
      requiresAuth: true,
      single: true,
    },
  },
]

export default router
