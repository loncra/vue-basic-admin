import type {ExportDataMetadata} from '@loncra/client/resource'
import {UserExportService} from '@loncra/client/resource'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'

const userExportService = new UserExportService()

/**
 * 我的导出的**核心**：service / i18nPrefix / 字段字典只写一次。
 * 列表形态在 `user-export.home.page.ts`（`UserExport.vue` 是非 Home 路由但同形）。
 */
export const userExportCore: CrudPageCore<ExportDataMetadata, ExportDataMetadata> = {
  service: userExportService,
  i18nPrefix: 'resourceServer.userExport',

  /** 字段字典：labelKey / format / enumRef 只写一次 */
  fields: {
    creationTime: {labelKey: 'common.creationTime'},
    filename: {labelKey: 'resourceServer.attachment.filename'},
    // 导出类型：后端 `ImportExportTypeEnum`（resource-server）
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.IMPORT_EXPORT_TYPE_ENUM},
    },
    size: {labelKey: 'common.size'},
    // 执行状态：后端 `ExecuteStatus`（resource-server）
    executeStatus: {
      labelKey: 'common.executeStatus',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM},
    },
    successTime: {labelKey: 'common.successTime'},
    expiresTime: {labelKey: 'common.expiresTime'},
  },
}
