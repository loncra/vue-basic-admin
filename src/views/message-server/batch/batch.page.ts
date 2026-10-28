import type {BatchMessageEntity} from '@loncra/client/message'
import {BatchMessageService} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_BATCH_ROUTE} from '@/constants'

const batchMessageService = new BatchMessageService()

export const batchCore: CrudPageCore<BatchMessageEntity, BatchMessageEntity> = {
  service: batchMessageService,
  i18nPrefix: 'messageServer.batch',
  routes: {
    home: MESSAGE_SERVER_BATCH_ROUTE.HOME,
    detail: MESSAGE_SERVER_BATCH_ROUTE.DETAIL,
  },

  fields: {
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
        id: SYSTEM_ENUM_TYPE.BATCH_MESSAGE_TYPE_ENUM,
      },
    },
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    executeStatus: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    count: {labelKey: 'messageServer.batch.count'},
    failNumber: {labelKey: 'messageServer.batch.failNumber'},
    successNumber: {labelKey: 'messageServer.batch.successNumber'},
    completeTime: {labelKey: 'common.completionTime', format: 'dateTime'},
  },
}
