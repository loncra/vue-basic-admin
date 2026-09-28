import type {EmailMessageEntity} from '@loncra/client/message'
import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {defineSearchProps, renderIconFont} from '@/utils'
import {MESSAGE_SERVER_EMAIL_AUTHORITY, MESSAGE_SERVER_EMAIL_ROUTE} from '@/constants'
import {emailCore} from './email.page'

/** 工具栏：发邮件（旧表 `actionButtons` 那一个按钮） */
function goSend(): void {
  void router.push({name: MESSAGE_SERVER_EMAIL_ROUTE.SEND})
}

/**
 * 邮件消息列表（`Home.vue`）。核心在 `email.page.ts`，这里只写列表形态。
 *
 * 照抄旧 `EmailTable.vue` 的 8 列（含搜索组件与表达式）；状态列与短信同款
 * （**统一用 pro 的 `executeStatusCell()`**）。旧表里那段 `column.dataIndex === 'channel'`
 * 的分支是**死代码**（邮件没有 channel 列）⇒ 不搬。
 */
export const emailHomePage = defineHomePage<EmailMessageEntity>(emailCore, {
  authority: {
    detail: MESSAGE_SERVER_EMAIL_AUTHORITY.GET,
    delete: MESSAGE_SERVER_EMAIL_AUTHORITY.DELETE,
  },
  rowSelection: {fixed: true, type: 'checkbox'},
  columns: [
    {
      key: 'creationTime',
      width: 210,
      ellipsis: true,
      search: defineSearchProps('dateRange', {expression: 'between'}),
    },
    {
      key: 'executeStatus',
      width: 100,
      ellipsis: true,
      render: executeStatusCell(),
      search: defineSearchProps('select', {
        expression: 'eq',
        props: {mode: 'multiple', maxTagCount: 2},
      }),
    },
    {
      key: 'type',
      width: 100,
      ellipsis: true,
      search: defineSearchProps('select', {
        expression: 'eq',
        props: {mode: 'multiple', maxTagCount: 2},
      }),
    },
    {key: 'title', width: 550, ellipsis: true, search: defineSearchProps('input')},
    {
      key: 'toEmail',
      width: 150,
      ellipsis: true,
      search: defineSearchProps('input', {expression: 'eq'}),
    },
    {key: 'successTime', width: 210, ellipsis: true},
    {
      key: 'retryCount',
      width: 80,
      ellipsis: true,
      // 旧表显示"重试次数 / 上限"（`maxRetryCount` 不是列 key ⇒ 用 render 拼）
      render: (_value, record) => `${record.retryCount ?? ''} / ${record.maxRetryCount ?? ''}`,
    },
    {key: 'retryTime', width: 210, ellipsis: true},
  ],
  toolbarActions: [
    {
      id: 'send',
      permission: MESSAGE_SERVER_EMAIL_AUTHORITY.SEND,
      label: () =>
        i18n.global.t('common.send', {name: i18n.global.t('messageServer.email.routePage')}),
      icon: () => renderIconFont('loncra-send'),
      run: goSend,
    },
  ],
})
