import {defineHomePage} from '@loncra/antdv-pro'
import type {SmsSignEntity} from '@loncra/client/message'
import {getEnumValue, SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {MESSAGE_SERVER_SMS_SIGN_AUTHORITY} from '@/constants'
import {defineSearchProps} from '@/utils'
import {signCore} from './sign.page'

/**
 * 短信签名列表（`Home.vue`）。核心在 `sign.page.ts`，这里只写列表形态。
 *
 * - 搜索项只有 `channel` / `status` 两个枚举下拉（桶由本页 `enums` 预载）；
 *   `format` 与 `enumRef` 在核心的字段字典里（值自带 `{name, value}`）。
 * - `auditionTime` 只在 `alibabaCloud` 渠道显示审核日期，其余显示空 ⇒ 必须**显式返回 `''`**
 *   （render 返回 `undefined` 表示不认领，会回落成表格原始值，显示就变了）。
 */
export const signHomePage = defineHomePage<SmsSignEntity, SmsSignEntity>(signCore, {
  authority: {detail: MESSAGE_SERVER_SMS_SIGN_AUTHORITY.GET},
  enums: [
    {
      module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      ids: [SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM, SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM],
    },
  ],
  columns: [
    {key: 'channel', width: 150, search: defineSearchProps('select')},
    {key: 'creationTime', width: 210, format: 'dateTime'},
    {key: 'name', width: 150},
    {key: 'status', width: 200, search: defineSearchProps('select')},
    {
      key: 'auditionTime',
      width: 210,
      render: (_value, record) =>
        getEnumValue(record.channel) === 'alibabaCloud' ? record.metadata?.rejectDate : '',
    },
    {key: 'remark', width: 320},
  ],
})
