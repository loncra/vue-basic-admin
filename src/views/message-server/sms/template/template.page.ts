import type {SmsTemplateEntity} from '@loncra/client/message'
import {SmsTemplateService} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'

const smsTemplateService = new SmsTemplateService('alibabaCloud')

export const templateCore: CrudPageCore<SmsTemplateEntity, SmsTemplateEntity> = {
  service: smsTemplateService,
  i18nPrefix: 'messageServer.smsTemplate',

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
    id: {labelKey: 'common.code'},
    name: {labelKey: 'common.name'},
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
        id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM,
      },
    },
    content: {labelKey: 'common.content'},
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM,
      },
    },
    auditionTime: {labelKey: 'common.auditionTime'},
  },
}
