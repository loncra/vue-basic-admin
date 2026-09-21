import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import type {BatchMessageEntity} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_BATCH_AUTHORITY,
} from '@/constants'
import {defineSearchProps, renderIconFont} from '@/utils'
import {batchCore} from './batch.page'

/** 批量消息列表（`Home.vue`）。核心在 `batch.page.ts`，这里只写列表形态。 */
export const batchHomePage = defineHomePage<BatchMessageEntity, BatchMessageEntity>(batchCore, {
  authority: {
    detail: MESSAGE_SERVER_BATCH_AUTHORITY.GET,
    delete: MESSAGE_SERVER_BATCH_AUTHORITY.DELETE,
  },
  enums: [
    {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, ids: [SYSTEM_ENUM_TYPE.BATCH_MESSAGE_TYPE_ENUM]},
    {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM]},
  ],
  rowSelection: {fixed: true, type: 'checkbox'},
  columns: [
    {key: 'type', width: 80, search: defineSearchProps('select')},
    {key: 'creationTime', width: 210, format: 'dateTime', search: defineSearchProps('dateRange')},
    {
      key: 'executeStatus',
      width: 80,
      search: defineSearchProps('select'),
      // 失败时多一个图标 + 悬浮显示异常信息：布局在 pro，图标的类型与渲染由宿主给
      render: executeStatusCell({
        renderIcon: renderIconFont,
        iconType: 'loncra-message-circle-warning',
      }),
    },
    {key: 'count', width: 200},
    {key: 'failNumber', width: 200},
    {key: 'successNumber', width: 200},
    {key: 'completeTime', width: 210, format: 'dateTime', search: defineSearchProps('dateRange')},
  ],
})
