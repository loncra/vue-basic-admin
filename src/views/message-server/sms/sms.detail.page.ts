import type {SmsMessageEntity} from '@loncra/client/message'
import {defineDetailPage, executeStatusCell} from '@loncra/antdv-pro'
import {smsCore} from './sms.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}

export const smsDetailPage = defineDetailPage(smsCore, {
  column: COLUMN,
  fields: [
    'creationTime',
    'channel',
    'type',
    {
      key: 'phoneNumber',
      render: (value, entity: SmsMessageEntity) => {
        const name = (entity.metadata?.toPrincipal as {name?: string} | undefined)?.name
        return name ? `${String(value ?? '')} (${name})` : String(value ?? '')
      },
    },
    {key: 'executeStatus', render: executeStatusCell()},
    {
      key: 'retryCount',
      render: (_value, entity: SmsMessageEntity) =>
        `${entity.retryCount ?? ''} / ${entity.maxRetryCount ?? ''}`,
    },
    'retryTime',
    'successTime',
    {key: 'exception', span: 'filled'},
    {key: 'remark', span: 'filled'},
    {key: 'content', span: 'filled'},
  ],
})
