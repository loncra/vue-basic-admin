import {h} from 'vue'
import {
  ATTACHMENT_UPLOAD_MODE,
  AttachmentUpload,
  defineDetailPage,
  executeStatusCell,
} from '@loncra/antdv-pro'
import type {SiteMessageEntity} from '@loncra/client/message'
import {getEnumName, getEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {siteCore} from './site.page'

const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 1, md: 1, sm: 1, xs: 1}

export const siteDetailPage = defineDetailPage(siteCore, {
  column: COLUMN,
  fields: [
    'creationTime',
    'type',
    {
      key: 'pushable',
      render: (value, entity: SiteMessageEntity) => {
        const name = getEnumName(value)
        if (getEnumValue(value) !== YES_OR_NO_TYPE.YES) {
          return name
        }
        const channels = (entity.channels ?? []).map((channel) => getEnumName(channel)).join(', ')
        return `${name} (${channels})`
      },
    },
    {
      key: 'toUser',
      render: (value, entity: SiteMessageEntity) => {
        const name = (entity.metadata?.toPrincipal as {name?: string} | undefined)?.name
        return name ? `${String(value ?? '')} (${name})` : String(value ?? '')
      },
    },
    {key: 'executeStatus', render: executeStatusCell()},
    {
      key: 'retryCount',
      render: (_value, entity: SiteMessageEntity) =>
        `${entity.retryCount ?? ''} / ${entity.maxRetryCount ?? ''}`,
    },
    'retryTime',
    'successTime',
    'readTime',
    {key: 'exception', span: 'filled'},
    {key: 'remark', span: 'filled'},
    {
      key: 'cover',
      span: 'filled',
      render: (_value, entity: SiteMessageEntity) =>
        h(AttachmentUpload, {
          mode: ATTACHMENT_UPLOAD_MODE.PICTURE_CARD,
          accept: '.jpg,.jpeg,.png',
          preview: true,
          maxCount: 1,
          multiple: false,
          value: entity.cover,
          classes: {
            item: 'w-[425px] h-[225px]',
            list: 'w-full justify-center',
            meta: 'w-[425px] mt-xxs max-w-full min-w-0',
          },
        }),
    },
    {key: 'title', span: 'filled'},
    {
      key: 'content',
      span: 'filled',
      render: (value) => h('div', {innerHTML: String(value ?? '')}),
    },
    {
      key: 'attachmentList',
      span: 'filled',
      render: (_value, entity: SiteMessageEntity) =>
        h(AttachmentUpload, {
          preview: true,
          mode: ATTACHMENT_UPLOAD_MODE.DRAGGER,
          value: entity.attachmentList,
        }),
    },
  ],
})
