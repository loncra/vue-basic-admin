import {h} from 'vue'
import {
  ATTACHMENT_UPLOAD_MODE,
  AttachmentUpload,
  defineDetailPage,
  executeStatusCell,
} from '@loncra/antdv-pro'
import type {SiteMessageEntity} from '@loncra/client/message'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {YES_OR_NO_TYPE} from '@/constants'
import {siteCore} from './site.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 1, md: 1, sm: 1, xs: 1}

/**
 * 站内信详情（`Detail.vue`）。核心在 `site.page.ts`，这里只写详情形态。
 *
 * 五处照旧（都是旧页面的原样行为）：
 * - `type` / `pushable` 在核心字典里写 `format: 'enum'`（= `getEnumName`）⇒ 不手写 `format`；
 * - **`executeStatus` 一律 `render: executeStatusCell()`**（状态点 + 状态名，全仓规矩，与列表同款）；
 * - `pushable` 可推送时后面括注推送渠道（`channels.map(getEnumName).join(', ')`）；
 * - 收件人后面括注姓名（`metadata.toPrincipal.name`）；
 * - 正文是 HTML（旧页面 `v-html`）⇒ 这里用 `innerHTML`；
 * - 封面 / 附件都用 pro 的 `AttachmentUpload` 只读预览（封面是 `picture-card` 那一套外观，
 *   连 `classes` 的尺寸配方一起照抄）。
 */
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
    {key: 'exception', span: 3},
    {key: 'remark', span: 3},
    {
      key: 'cover',
      span: 3,
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
    {key: 'title', span: 3},
    {
      key: 'content',
      span: 3,
      // 照抄旧页面的 `v-html`：正文本身是 HTML（站内信内容），这里不做转义
      render: (value) => h('div', {innerHTML: String(value ?? '')}),
    },
    {
      key: 'attachmentList',
      span: 3,
      render: (_value, entity: SiteMessageEntity) =>
        h(AttachmentUpload, {
          preview: true,
          mode: ATTACHMENT_UPLOAD_MODE.DRAGGER,
          value: entity.attachmentList,
        }),
    },
  ],
})
