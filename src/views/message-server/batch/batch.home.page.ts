import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import type {BatchMessageEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_BATCH_AUTHORITY} from '@loncra/client/message'
import {defineSearchProps} from '@/utils'
import {batchCore} from './batch.page'

export const batchHomePage = defineHomePage<BatchMessageEntity, BatchMessageEntity>(batchCore, {
  authority: {
    detail: MESSAGE_SERVER_BATCH_AUTHORITY.GET,
    delete: MESSAGE_SERVER_BATCH_AUTHORITY.DELETE,
  },
  rowSelection: {fixed: true, type: 'checkbox'},
  columns: [
    {key: 'type', width: 80, search: defineSearchProps('select')},
    {key: 'creationTime', width: 210, search: defineSearchProps('dateRange')},
    {
      key: 'executeStatus',
      width: 80,
      search: defineSearchProps('select'),
      render: executeStatusCell(),
    },
    {key: 'count', width: 200},
    {key: 'failNumber', width: 200},
    {key: 'successNumber', width: 200},
    {key: 'completeTime', width: 210, search: defineSearchProps('dateRange')},
  ],
})
