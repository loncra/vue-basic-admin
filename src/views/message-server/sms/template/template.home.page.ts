import {defineHomePage} from '@loncra/antdv-pro'
import type {SmsTemplateEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY} from '@loncra/client/message'
import {getEnumValue} from '@loncra/client/commons'
import {defineSearchProps} from '@/utils'
import {templateCore} from './template.page'

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
