import type {SmsMessageEntity} from '@loncra/client/message'
import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {defineSearchProps, renderIconFont} from '@/utils'
import {
  MESSAGE_SERVER_SMS_AUTHORITY,
  MESSAGE_SERVER_SMS_ROUTE,
  MESSAGE_SERVER_SMS_SIGN_AUTHORITY,
  MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY,
} from '@/constants'
import {smsCore} from './sms.page'

/** 工具栏的三个跳转（旧表 `actionButtons`）：发短信 / 模板 / 签名 */
function goSend(): void {
  void router.push({name: MESSAGE_SERVER_SMS_ROUTE.SEND})
}

function goTemplate(): void {
  void router.push({name: MESSAGE_SERVER_SMS_ROUTE.TEMPLATE})
}

function goSign(): void {
  void router.push({name: MESSAGE_SERVER_SMS_ROUTE.SIGN})
}

/**
 * 短信消息列表（`Home.vue`）。核心在 `sms.page.ts`，这里只写列表形态。
 *
 * 照抄旧 `SmsTable.vue` 的 9 列（含每列的搜索组件与表达式）：
 * - 渠道 / 类型 / 状态三个下拉都是**多选**（`mode: 'multiple'` + `maxTagCount: 2`，表达式 `eq`）；
 * - 状态列**统一用 pro 的 `executeStatusCell()`**（状态点 + 状态名；失败且有 `exception` 时整块套 tooltip）；
 * - 重试次数显示 `重试 / 上限`（旧表 `{{ retryCount }} / {{ maxRetryCount }}`）；
 * - 三个时间列的 `format: 'dateTime'` 写在核心字典里。
 *
 * 嵌入用法（`batch/Detail` 的子表）在壳上给 `:record-actions="false"` / `:row-selection="false"`
 * / `:title="false"` + `plain`，等价旧组件的 `preview`。
 */
export const smsHomePage = defineHomePage<SmsMessageEntity>(smsCore, {
  authority: {
    detail: MESSAGE_SERVER_SMS_AUTHORITY.GET,
    delete: MESSAGE_SERVER_SMS_AUTHORITY.DELETE,
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
    {
      key: 'channel',
      width: 200,
      ellipsis: true,
      search: defineSearchProps('select', {
        expression: 'eq',
        props: {mode: 'multiple', maxTagCount: 2},
      }),
    },
    {
      key: 'phoneNumber',
      width: 150,
      ellipsis: true,
      search: defineSearchProps('input', {expression: 'eq'}),
    },
    {key: 'content', width: 550, ellipsis: true, search: defineSearchProps('input')},
    {key: 'successTime', width: 210, ellipsis: true},
    {
      key: 'retryCount',
      width: 80,
      ellipsis: true,
      // 旧表显示的是"重试次数 / 上限"（`maxRetryCount` 不是列 key，所以用 render 拼）
      render: (_value, record) => `${record.retryCount ?? ''} / ${record.maxRetryCount ?? ''}`,
    },
    {key: 'retryTime', width: 210, ellipsis: true},
  ],
  toolbarActions: [
    {
      id: 'send',
      permission: MESSAGE_SERVER_SMS_AUTHORITY.SEND,
      label: () =>
        i18n.global.t('common.send', {name: i18n.global.t('messageServer.sms.routePage')}),
      icon: () => renderIconFont('loncra-send'),
      run: goSend,
    },
    {
      id: 'template',
      permission: MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY.FIND,
      label: () => i18n.global.t('messageServer.sms.template.routePage'),
      icon: () => renderIconFont('loncra-layout-template'),
      run: goTemplate,
    },
    {
      id: 'sign',
      permission: MESSAGE_SERVER_SMS_SIGN_AUTHORITY.FIND,
      label: () => i18n.global.t('messageServer.sms.sign.routePage'),
      icon: () => renderIconFont('loncra-signature'),
      run: goSign,
    },
  ],
})
