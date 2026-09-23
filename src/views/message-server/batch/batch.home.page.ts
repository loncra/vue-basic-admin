import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import type {BatchMessageEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_BATCH_AUTHORITY,} from '@/constants'
import {defineSearchProps} from '@/utils'
import {batchCore} from './batch.page'

/** 批量消息列表（`Home.vue`）。核心在 `batch.page.ts`，这里只写列表形态。 */
export const batchHomePage = defineHomePage<BatchMessageEntity, BatchMessageEntity>(batchCore, {
  authority: {
    detail: MESSAGE_SERVER_BATCH_AUTHORITY.GET,
    delete: MESSAGE_SERVER_BATCH_AUTHORITY.DELETE,
  },
  rowSelection: {fixed: true, type: 'checkbox'},
  columns: [
    {key: 'type', width: 80, search: defineSearchProps('select')},
    {key: 'creationTime', width: 210, format: 'dateTime', search: defineSearchProps('dateRange')},
    {
      key: 'executeStatus',
      width: 80,
      search: defineSearchProps('select'),
      // 状态点 + 状态名（`a-badge`）：映射与布局都在 pro（失败且有 exception 时悬浮显示原因）
      render: executeStatusCell(),
    },
    {key: 'count', width: 200},
    {key: 'failNumber', width: 200},
    {key: 'successNumber', width: 200},
    {key: 'completeTime', width: 210, format: 'dateTime', search: defineSearchProps('dateRange')},
  ],
})
