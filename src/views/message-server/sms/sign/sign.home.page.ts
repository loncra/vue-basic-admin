import {defineHomePage} from '@loncra/antdv-pro'
import type {SmsSignEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_SMS_SIGN_AUTHORITY} from '@loncra/client/message'
import {getEnumValue} from '@loncra/client/commons'
import {defineSearchProps} from '@/utils'
import {signCore} from './sign.page'

export const signHomePage = defineHomePage<SmsSignEntity, SmsSignEntity>(signCore, {
  authority: {detail: MESSAGE_SERVER_SMS_SIGN_AUTHORITY.GET},
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
