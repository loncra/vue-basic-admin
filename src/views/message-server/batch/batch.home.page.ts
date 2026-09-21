import {defineHomePage, executeStatusCell} from '@loncra/antdv-pro'
import type {BatchMessageEntity} from '@loncra/client/message'
import {BatchMessageService} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_BATCH_AUTHORITY,
  MESSAGE_SERVER_BATCH_ROUTE,
} from '@/constants'
import {defineSearchProps, renderIconFont} from '@/utils'

/** 桶按「模块 + 枚举 id」索引（`BATCH_MESSAGE_TYPE_ENUM` 在 message-server，不在 resource-server） */
const TYPE_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
  id: SYSTEM_ENUM_TYPE.BATCH_MESSAGE_TYPE_ENUM,
}
const EXECUTE_STATUS_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
  id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
}

/**
 * 批量消息列表（`Home.vue`）。
 * 只写 home 形态：Form / Detail 还在宿主旧 kit，等批次 4 再拆 `batch.page.ts`。
 */
export const batchHomePage = defineHomePage<BatchMessageEntity, BatchMessageEntity>(
  {
    service: new BatchMessageService(),
    i18nPrefix: 'messageServer.batch',
    routes: {detail: MESSAGE_SERVER_BATCH_ROUTE.DETAIL},
  },
  {
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
      {
        key: 'type',
        labelKey: 'common.type',
        width: 80,
        format: 'enum',
        enumRef: TYPE_ENUM_REF,
        search: defineSearchProps('select'),
      },
      {
        key: 'creationTime',
        labelKey: 'common.creationTime',
        width: 210,
        format: 'dateTime',
        search: defineSearchProps('dateRange'),
      },
      {
        key: 'executeStatus',
        labelKey: 'common.status',
        width: 80,
        enumRef: EXECUTE_STATUS_ENUM_REF,
        search: defineSearchProps('select'),
        // 失败时多一个图标 + 悬浮显示异常信息：布局在 pro，图标的类型与渲染由宿主给
        render: executeStatusCell({
          renderIcon: renderIconFont,
          iconType: 'loncra-message-circle-warning',
        }),
      },
      {key: 'count', labelKey: 'messageServer.batch.count', width: 200},
      {key: 'failNumber', labelKey: 'messageServer.batch.failNumber', width: 200},
      {key: 'successNumber', labelKey: 'messageServer.batch.successNumber', width: 200},
      {
        key: 'completeTime',
        labelKey: 'common.completionTime',
        width: 210,
        format: 'dateTime',
        search: defineSearchProps('dateRange'),
      },
    ],
  },
)
