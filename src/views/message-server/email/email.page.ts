import type {EmailMessageEntity} from '@loncra/client/message'
import {EmailMessageService} from '@loncra/client/message'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_EMAIL_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const emailMessageService = new EmailMessageService()

export const emailCore: CrudPageCore<EmailMessageEntity> = {
  service: emailMessageService,
  i18nPrefix: 'messageServer.email',
  routes: {
    home: MESSAGE_SERVER_EMAIL_ROUTE.HOME,
    detail: MESSAGE_SERVER_EMAIL_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.EMAIL_MESSAGE,
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
    toEmail: {labelKey: 'common.email'},
    successTime: {labelKey: 'common.successTime', format: 'dateTime'},
    retryCount: {labelKey: 'common.retry.count'},
    retryTime: {labelKey: 'common.retry.time', format: 'dateTime'},
    exception: {labelKey: 'error.errorMessage'},
    fromEmail: {labelKey: 'messageServer.email.fromEmail'},
    remark: {labelKey: 'common.remark'},
    content: {labelKey: 'common.content'},
    attachmentList: {labelKey: 'attachment.text'},
  },
}
