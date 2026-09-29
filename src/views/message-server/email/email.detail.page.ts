import {h} from 'vue'
import {
  ATTACHMENT_UPLOAD_MODE,
  AttachmentUpload,
  defineDetailPage,
  executeStatusCell,
} from '@loncra/antdv-pro'
import type {EmailMessageEntity} from '@loncra/client/message'
import {emailCore} from './email.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}

/**
 * 邮件消息详情（`Detail.vue`）。核心在 `email.page.ts`，这里只写详情形态。
 *
 * 四处照旧（都是旧页面的原样行为）：
 * - `type` 在核心字典里写 `format: 'enum'`（= `getEnumName`）⇒ 不手写 `render`；
 *   `值自带 {name, value}` 出名称、裸 code 原样显示；
 * - **`executeStatus` 一律 `render: executeStatusCell()`**（状态点 + 状态名，全仓规矩，与列表同款）；
 * - `fromEmail` / `toEmail` 是**普通字符串**（旧页面那两处 `getEnumName(...)` 对字符串是恒等，
 *   照等价写成裸值）；收件邮箱后面括注收件人（`metadata.toPrincipal.name`）；
 * - 重试次数与上限显示在同一项里（`重试 / 上限`）；
 * - 正文是 HTML（旧页面 `v-html`）⇒ 这里用 `innerHTML`；附件用 pro 的 `AttachmentUpload`
 *   只读预览（`preview` + `mode: dragger`，与旧页面同一组件）。
 */
export const emailDetailPage = defineDetailPage(emailCore, {
  column: COLUMN,
  fields: [
    'creationTime',
    'type',
    'fromEmail',
    {
      key: 'toEmail',
      // 列表那列叫 `common.email`，详情这里沿用旧页面的「收件邮箱」
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
      // 照抄旧页面的 `v-html`：正文本身是 HTML（邮件内容），这里不做转义
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
