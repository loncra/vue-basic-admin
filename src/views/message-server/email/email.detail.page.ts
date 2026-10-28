import {h} from 'vue'
import {
  ATTACHMENT_UPLOAD_MODE,
  AttachmentUpload,
  defineDetailPage,
  executeStatusCell,
} from '@loncra/antdv-pro'
import type {EmailMessageEntity} from '@loncra/client/message'
import {emailCore} from './email.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}

export const emailDetailPage = defineDetailPage(emailCore, {
  column: COLUMN,
  fields: [
    'creationTime',
    'type',
    'fromEmail',
    {
      key: 'toEmail',
      labelKey: 'messageServer.email.receiveEmail',
      render: (value, entity: EmailMessageEntity) => {
        const name = (entity.metadata?.toPrincipal as {name?: string} | undefined)?.name
        return name ? `${String(value ?? '')} (${name})` : String(value ?? '')
      },
    },
    {key: 'executeStatus', render: executeStatusCell()},
    {
      key: 'retryCount',
      render: (_value, entity: EmailMessageEntity) =>
        `${entity.retryCount ?? ''} / ${entity.maxRetryCount ?? ''}`,
    },
    'retryTime',
    'successTime',
    {key: 'exception', span: 'filled'},
    {key: 'remark', span: 'filled'},
    {key: 'title', span: 'filled'},
    {
      key: 'content',
      span: 'filled',
      render: (value) => h('div', {innerHTML: String(value ?? '')}),
    },
    {
      key: 'attachmentList',
      span: 'filled',
      render: (_value, entity: EmailMessageEntity) =>
        h(AttachmentUpload, {
          preview: true,
          mode: ATTACHMENT_UPLOAD_MODE.DRAGGER,
          value: entity.attachmentList,
        }),
    },
  ],
})
