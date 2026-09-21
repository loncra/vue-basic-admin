import type {SmsTemplateEntity} from '@loncra/client/message'
import {SmsTemplateService} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'

const smsTemplateService = new SmsTemplateService('alibabaCloud')

/**
 * 短信模板的**核心**：service / i18nPrefix / 字段字典只写一次。
 * 列表形态在 `template.home.page.ts`。
 *
 * 与签名页同构：**没有 detail 路由** ⇒ 不写 `routes.detail`。
 */
export const templateCore: CrudPageCore<SmsTemplateEntity, SmsTemplateEntity> = {
  service: smsTemplateService,
  i18nPrefix: 'messageServer.smsTemplate',

  /** 字段字典：labelKey / format / enumRef 只写一次 */
  fields: {
    // 渠道：后端 `CloudChannelEnum`（resource-server）
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
    // 模板类型：后端 `MessageTypeEnum`（message-server）
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
        id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM,
      },
    },
    content: {labelKey: 'common.content'},
    // 审核状态：后端 `AuditStatusEnum`（resource-server）
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
