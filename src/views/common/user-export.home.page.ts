import {defineHomePage} from '@loncra/antdv-pro'
import type {ExportDataMetadata, FileObject} from '@loncra/client/resource'
import {AttachmentService, UserExportService} from '@loncra/client/resource'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {EXECUTE_STATUS_TYPE} from '@/constants'
import i18n from '@/i18n'
import {renderIconFont} from '@/utils/commonUtils'

/** 导出类型：后端 `ImportExportTypeEnum`、执行状态：`ExecuteStatus`（都在 resource-server） */
const IMPORT_EXPORT_TYPE_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
  id: SYSTEM_ENUM_TYPE.IMPORT_EXPORT_TYPE_ENUM,
}
const EXECUTE_STATUS_ENUM_REF = {
  module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
  id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
}

function downloadRecord(record: ExportDataMetadata) {
  const data = record.metadata?.data as FileObject | undefined
  if (!data?.bucketName || !data.objectName) {
    return
  }
  AttachmentService.download(data.bucketName, data.objectName)
}

/**
 * 我的导出（`UserExport.vue`，非 Home 路由但同形）。
 *
 * 单行下载 / 批量下载都是**本业务自己的动作**（pro 只预置 add / deleteSelected），
 * 批量下载读 `ctx.selectedItems`，不需要页面壳喂选择态。
 */
export const userExportHomePage = defineHomePage<ExportDataMetadata, ExportDataMetadata>(
  {
    service: new UserExportService(),
    i18nPrefix: 'resourceServer.userExport',
  },
  {
    authority: {delete: true},
    rowSelection: {fixed: true, type: 'checkbox'},
    enums: [
      {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        ids: [SYSTEM_ENUM_TYPE.IMPORT_EXPORT_TYPE_ENUM, SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM],
      },
    ],
    columns: [
      {key: 'creationTime', labelKey: 'common.creationTime', width: 210, format: 'dateTime'},
      {key: 'filename', labelKey: 'resourceServer.attachment.filename', width: 400},
      {
        key: 'type',
        labelKey: 'common.type',
        width: 120,
        format: 'enum',
        enumRef: IMPORT_EXPORT_TYPE_ENUM_REF,
      },
      {key: 'size', labelKey: 'common.size', width: 150, format: 'byte'},
      {
        key: 'executeStatus',
        labelKey: 'common.executeStatus',
        width: 210,
        format: 'enum',
        enumRef: EXECUTE_STATUS_ENUM_REF,
      },
      {key: 'successTime', labelKey: 'common.successTime', width: 210, format: 'dateTime'},
      {key: 'expiresTime', labelKey: 'common.expiresTime', width: 210, format: 'dateTime'},
    ],
    rowActions: [
      {
        id: 'download',
        permission: true,
        label: () => i18n.global.t('common.download.text'),
        icon: () => renderIconFont('loncra-download', 'align'),
        run: (ctx) => {
          if (ctx.record) {
            downloadRecord(ctx.record)
          }
        },
      },
    ],
    titleActions: [
      {
        id: 'downloadSelected',
        permission: true,
        label: (ctx) => i18n.global.t('common.download.selected', {count: ctx.selectedItems.length}),
        enabled: (ctx) =>
          ctx.selectedItems.some((item) => item.executeStatus.value === EXECUTE_STATUS_TYPE.SUCCESS),
        icon: () => renderIconFont('loncra-download', 'align'),
        run: (ctx) => {
          const files: FileObject[] = ctx.selectedItems
            .filter((item) => item.executeStatus.value === EXECUTE_STATUS_TYPE.SUCCESS)
            .map((item) => item.metadata)
            .map((metadata) => metadata.data as FileObject)
          AttachmentService.downloads(files)
        },
      },
    ],
  },
)
