import type {SmsMessageEntity} from '@loncra/client/message'
import {SmsMessageService} from '@loncra/client/message'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_SMS_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

const smsMessageService = new SmsMessageService()

export const smsCore: CrudPageCore<SmsMessageEntity> = {
  service: smsMessageService,
  i18nPrefix: 'messageServer.sms',
  routes: {
    home: MESSAGE_SERVER_SMS_ROUTE.HOME,
    detail: MESSAGE_SERVER_SMS_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.SMS_MESSAGE,

  fields: {
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    channel: {
      labelKey: 'common.channel',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM},
    },
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM},
    },
    phoneNumber: {labelKey: 'common.phoneNumber'},
    executeStatus: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    retryCount: {labelKey: 'common.retry.count'},
    retryTime: {labelKey: 'common.retry.time', format: 'dateTime'},
    successTime: {labelKey: 'common.successTime', format: 'dateTime'},
    exception: {labelKey: 'error.errorMessage'},
    remark: {labelKey: 'common.remark'},
    content: {labelKey: 'common.content'},
  },
}
