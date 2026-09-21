import type {BatchMessageEntity} from '@loncra/client/message'
import {BatchMessageService} from '@loncra/client/message'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_BATCH_ROUTE} from '@/constants'

const batchMessageService = new BatchMessageService()

/**
 * 批量消息的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 * 列表形态在 `batch.home.page.ts`（Detail 还在宿主旧 kit，等批次 4 再拆）。
 */
export const batchCore: CrudPageCore<BatchMessageEntity, BatchMessageEntity> = {
  service: batchMessageService,
  i18nPrefix: 'messageServer.batch',
  routes: {detail: MESSAGE_SERVER_BATCH_ROUTE.DETAIL},

  /** 字段字典：labelKey / format / enumRef 只写一次 */
  fields: {
    // 桶按「模块 + 枚举 id」索引：`BATCH_MESSAGE_TYPE_ENUM` 在 **message-server**
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
        id: SYSTEM_ENUM_TYPE.BATCH_MESSAGE_TYPE_ENUM,
      },
    },
    creationTime: {labelKey: 'common.creationTime'},
    // 执行状态：后端 `ExecuteStatus`（resource-server）；显示由列上的 `executeStatusCell` 负责
    executeStatus: {
      labelKey: 'common.status',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    count: {labelKey: 'messageServer.batch.count'},
    failNumber: {labelKey: 'messageServer.batch.failNumber'},
    successNumber: {labelKey: 'messageServer.batch.successNumber'},
    completeTime: {labelKey: 'common.completionTime'},
  },
}
