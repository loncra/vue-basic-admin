import {defineHomePage} from '@loncra/antdv-pro'
import type {SmsSignEntity} from '@loncra/client/message'
import {SmsSignService} from '@loncra/client/message'
import {getEnumValue, SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {MESSAGE_SERVER_SMS_SIGN_AUTHORITY} from '@/constants'

/** 渠道：后端 `CloudChannelEnum`、审核状态：`AuditStatusEnum`（都在 resource-server） */
const CHANNEL_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
  id: SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM,
}
const AUDIT_STATUS_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
  id: SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM,
}

/**
 * 短信签名列表（`Home.vue`）。
 *
 * - 本页没有搜索项；`channel` / `status` 用 `format: 'enum'`（值自带 `{name, value}`），
 *   `enumRef` 是"声明即断言值的形状"，桶由 pro 自己预载。
 * - `auditionTime` 只在 `alibabaCloud` 渠道显示审核日期，其余显示空 ⇒ 必须**显式返回 `''`**
 *   （render 返回 `undefined` 表示不认领，会回落成表格原始值，显示就变了）。
 * - 现状：`routers/message-server/sms.ts` 没有注册签名的 detail 路由，所以不写 `routes.detail`（点详情不跳）。
 */
export const signHomePage = defineHomePage<SmsSignEntity, SmsSignEntity>(
  {
    service: new SmsSignService('alibabaCloud'),
    i18nPrefix: 'messageServer.smsSign',
  },
  {
    authority: {detail: MESSAGE_SERVER_SMS_SIGN_AUTHORITY.GET},
    enums: [
      {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        ids: [SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM, SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM],
      },
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
      {key: 'name', labelKey: 'common.name', width: 150},
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
      {key: 'remark', labelKey: 'common.remark', width: 320},
    ],
  },
)
