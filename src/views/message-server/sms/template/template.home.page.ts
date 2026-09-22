import {defineHomePage} from '@loncra/antdv-pro'
import type {SmsTemplateEntity} from '@loncra/client/message'
import {getEnumValue, SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY} from '@/constants'
import {defineSearchProps} from '@/utils'
import {templateCore} from './template.page'

/**
 * 短信模板列表（`Home.vue`）。核心在 `template.page.ts`，这里只写列表形态。
 *
 * 与签名页同构：搜索项是三个枚举下拉（桶由本页 `enums` 预载）；
 * `auditionTime` 只在 `alibabaCloud` 显示（其余**显式 `''`**）。
 */
export const templateHomePage = defineHomePage<SmsTemplateEntity, SmsTemplateEntity>(
  templateCore,
  {
    authority: {detail: MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY.GET},
    columns: [
      {key: 'channel', width: 150, search: defineSearchProps('select')},
      {key: 'creationTime', width: 210, format: 'dateTime'},
      {key: 'id', width: 150},
      {key: 'name', width: 150},
      {key: 'type', width: 150, search: defineSearchProps('select')},
      {key: 'content', width: 350},
      {key: 'status', width: 200, search: defineSearchProps('select')},
      {
        key: 'auditionTime',
        width: 210,
        render: (_value, record) =>
          getEnumValue(record.channel) === 'alibabaCloud' ? record.metadata?.rejectDate : '',
      },
    ],
  },
)
