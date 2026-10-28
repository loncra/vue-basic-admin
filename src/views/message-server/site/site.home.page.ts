import {h} from 'vue'
import {Tooltip} from 'antdv-next'
import type {SiteMessageEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_SITE_AUTHORITY} from '@loncra/client/message'
import {getEnumName, getEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {defineSearchProps, renderIconFont} from '@/utils'
import {MESSAGE_SERVER_SITE_ROUTE} from '@/constants'
import {siteCore} from './site.page'

function goSend(): void {
  void router.push({name: MESSAGE_SERVER_SITE_ROUTE.SEND})
}

function pushableCell(_value: unknown, record: SiteMessageEntity) {
  if (getEnumValue(record.pushable) !== YES_OR_NO_TYPE.YES) {
    return ''
  }
  const channels = (record.channels ?? []).map((item) => getEnumName(item)).join(',')
  return h(
    Tooltip,
    {title: `${i18n.global.t('messageServer.site.channel')}:${channels}`},
    {default: () => getEnumName(record.pushable)},
  )
}

export const siteHomePage = defineHomePage<SiteMessageEntity>(siteCore, {
  authority: {
    detail: MESSAGE_SERVER_SITE_AUTHORITY.GET,
    delete: MESSAGE_SERVER_SITE_AUTHORITY.DELETE,
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
      key: 'toUser',
      width: 150,
      ellipsis: true,
      search: defineSearchProps('input', {expression: 'eq'}),
    },
    {key: 'pushable', width: 80, ellipsis: true, render: pushableCell},
    {key: 'readTime', width: 210, ellipsis: true},
  ],
  toolbarActions: [
    {
      id: 'send',
      permission: MESSAGE_SERVER_SITE_AUTHORITY.SEND,
      label: () =>
        i18n.global.t('common.send', {name: i18n.global.t('messageServer.site.routePage')}),
      icon: () => renderIconFont('loncra-send'),
      run: goSend,
    },
  ],
})
