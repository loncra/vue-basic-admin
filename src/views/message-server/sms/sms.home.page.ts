import type {SmsMessageEntity} from '@loncra/client/message'
import {
  MESSAGE_SERVER_SMS_AUTHORITY,
  MESSAGE_SERVER_SMS_SIGN_AUTHORITY,
  MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY,
} from '@loncra/client/message'
import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {defineSearchProps, renderIconFont} from '@/utils'
import {MESSAGE_SERVER_SMS_ROUTE} from '@/constants'
import {smsCore} from './sms.page'

function goSend(): void {
  void router.push({name: MESSAGE_SERVER_SMS_ROUTE.SEND})
}

function goTemplate(): void {
  void router.push({name: MESSAGE_SERVER_SMS_ROUTE.TEMPLATE})
}

function goSign(): void {
  void router.push({name: MESSAGE_SERVER_SMS_ROUTE.SIGN})
}

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
