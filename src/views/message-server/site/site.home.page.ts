import {h} from 'vue'
import {Tooltip} from 'antdv-next'
import type {SiteMessageEntity} from '@loncra/client/message'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {defineSearchProps, renderIconFont} from '@/utils'
import {MESSAGE_SERVER_SITE_AUTHORITY, MESSAGE_SERVER_SITE_ROUTE, YES_OR_NO_TYPE} from '@/constants'
import {siteCore} from './site.page'

/** 工具栏：发站内信（旧表 `actionButtons` 那一个按钮） */
function goSend(): void {
  void router.push({name: MESSAGE_SERVER_SITE_ROUTE.SEND})
}

/**
 * 「可推送」列：**只有"是"才显示**（旧表 `#bodyCell` 就是这么写的：不是"是"时整格空白），
 * 鼠标悬浮显示这条消息推了哪些渠道（旧表的 `getChannelsName`）。
 */
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

/**
 * 站内信列表（`Home.vue`）。核心在 `site.page.ts`，这里只写列表形态。
 *
 * 照抄旧 `SiteTable.vue` 的 7 列（含搜索组件与表达式）；状态列与短信/邮件同款
 * （**统一用 pro 的 `executeStatusCell()`**）。旧表里那段 `applyColumnOptions(columns, 'channel', …)`
 * 是**死代码**（站内信没有 channel 列）⇒ 不搬。
 */
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
