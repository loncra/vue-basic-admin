import type {SiteMessageEntity} from '@loncra/client/message'
import {SiteMessageService} from '@loncra/client/message'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  MESSAGE_SERVER_SITE_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

export const siteMessageService = new SiteMessageService()

/**
 * 站内信的**核心**：service / i18nPrefix / routes / 字段字典只写一次
 * （旧实现是 `components/message-server/SiteTable.vue` 里手写一份）。
 *
 * `pushable` 只是显示（值自带元数据，没有搜索项）⇒ 只给 `format: 'enum'`，不给 `enumRef`。
 */
export const siteCore: CrudPageCore<SiteMessageEntity> = {
  service: siteMessageService,
  i18nPrefix: 'messageServer.site',
  routes: {
    home: MESSAGE_SERVER_SITE_ROUTE.HOME,
    detail: MESSAGE_SERVER_SITE_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.SITE_MESSAGE,
  fields: {
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    executeStatus: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM},
    },
    title: {labelKey: 'common.title'},
    toUser: {labelKey: 'auth.principal'},
    pushable: {labelKey: 'messageServer.site.pushable', format: 'enum'},
    readTime: {labelKey: 'common.read.time', format: 'dateTime'},
    exception: {labelKey: 'error.errorMessage'},
  },
}
