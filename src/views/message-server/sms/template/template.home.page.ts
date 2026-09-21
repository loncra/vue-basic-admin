import {defineHomePage} from '@loncra/antdv-pro'
import type {SmsTemplateEntity} from '@loncra/client/message'
import {SmsTemplateService} from '@loncra/client/message'
import {getEnumValue, SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY} from '@/constants'

/** 渠道 `CloudChannelEnum`、审核状态 `AuditStatusEnum`（resource-server）；模板类型 `MessageTypeEnum`（message-server） */
const CHANNEL_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
  id: SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM,
}
const AUDIT_STATUS_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
  id: SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM,
}
const MESSAGE_TYPE_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
  id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM,
}

/**
 * 短信模板列表（`Home.vue`）。与签名页同构：无搜索项、`auditionTime` 只在 `alibabaCloud`
 * 显示（其余**显式 `''`**）；本页同样没有 detail 路由 ⇒ 不写 `routes.detail`。
 */
export const templateHomePage = defineHomePage<SmsTemplateEntity, SmsTemplateEntity>(
  {
    service: new SmsTemplateService('alibabaCloud'),
    i18nPrefix: 'messageServer.smsTemplate',
  },
  {
    authority: {detail: MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY.GET},
    enums: [
      {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        ids: [SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM, SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM],
      },
      {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, ids: [SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM]},
    ],
    columns: [
      {
        key: 'channel',
        labelKey: 'common.channel',
        width: 150,
        format: 'enum',
        enumRef: CHANNEL_ENUM_REF,
      },
      {key: 'creationTime', labelKey: 'common.creationTime', width: 210, format: 'dateTime'},
      {key: 'id', labelKey: 'common.code', width: 150},
      {key: 'name', labelKey: 'common.name', width: 150},
      {key: 'type', labelKey: 'common.type', width: 150, format: 'enum', enumRef: MESSAGE_TYPE_ENUM_REF},
      {key: 'content', labelKey: 'common.content', width: 350},
      {
        key: 'status',
        labelKey: 'common.status',
        width: 200,
        format: 'enum',
        enumRef: AUDIT_STATUS_ENUM_REF,
      },
      {
        key: 'auditionTime',
        labelKey: 'common.auditionTime',
        width: 210,
        render: (_value, record) =>
          getEnumValue(record.channel) === 'alibabaCloud' ? record.metadata?.rejectDate : '',
      },
    ],
  },
)
