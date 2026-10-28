import type {SiteMessageEntity} from '@loncra/client/message'
import {SiteMessageService} from '@loncra/client/message'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_SITE_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const siteMessageService = new SiteMessageService()

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
    retryCount: {labelKey: 'common.retry.count'},
    retryTime: {labelKey: 'common.retry.time', format: 'dateTime'},
    successTime: {labelKey: 'common.successTime', format: 'dateTime'},
    title: {labelKey: 'common.title'},
    toUser: {labelKey: 'auth.principal'},
    pushable: {labelKey: 'messageServer.site.pushable', format: 'enum'},
    readTime: {labelKey: 'common.read.time', format: 'dateTime'},
    exception: {labelKey: 'error.errorMessage'},
    remark: {labelKey: 'common.remark'},
    cover: {labelKey: 'common.cover'},
    content: {labelKey: 'common.content'},
    attachmentList: {labelKey: 'attachment.text'},
  },
}
