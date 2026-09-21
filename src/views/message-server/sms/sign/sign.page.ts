import type {SmsSignEntity} from '@loncra/client/message'
import {SmsSignService} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'

const smsSignService = new SmsSignService('alibabaCloud')

/**
 * 短信签名的**核心**：service / i18nPrefix / 字段字典只写一次。
 * 列表形态在 `sign.home.page.ts`。
 *
 * **没有 detail 路由**（`routers/message-server/sms.ts` 只注册了 message 的 detail），所以不写 `routes.detail`。
 */
export const signCore: CrudPageCore<SmsSignEntity, SmsSignEntity> = {
  service: smsSignService,
  i18nPrefix: 'messageServer.smsSign',

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
    name: {labelKey: 'common.name'},
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
    remark: {labelKey: 'common.remark'},
  },
}
