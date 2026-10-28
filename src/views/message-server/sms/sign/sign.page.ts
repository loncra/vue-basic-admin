import type {SmsSignEntity} from '@loncra/client/message'
import {SmsSignService} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'

const smsSignService = new SmsSignService('alibabaCloud')

export const signCore: CrudPageCore<SmsSignEntity, SmsSignEntity> = {
  service: smsSignService,
  i18nPrefix: 'messageServer.smsSign',

  fields: {
    channel: {
      labelKey: 'common.channel',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM,
      },
    },
    creationTime: {labelKey: 'common.creationTime'},
    name: {labelKey: 'common.name'},
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM,
      },
    },
    auditionTime: {labelKey: 'common.auditionTime'},
    remark: {labelKey: 'common.remark'},
  },
}
