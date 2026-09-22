import {
  defineHomePage,
  type RecordActionContext,
  type ToolbarActionContext,
} from '@loncra/antdv-pro'
import type {ExportDataMetadata, FileObject} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {EXECUTE_STATUS_TYPE} from '@/constants'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {userExportCore} from './user-export.page'

/** 单行下载：当前行有附件就下载（后端没给 bucket / object 就什么都不做） */
function downloadFile(ctx: RecordActionContext<ExportDataMetadata>): void {
  const data = ctx.record?.metadata?.data as FileObject | undefined
  if (!data?.bucketName || !data.objectName) {
    return
  }
  AttachmentService.download(data.bucketName, data.objectName)
}

/** 批量下载：只下执行成功的那些（其余后端还没有可下载的文件） */
function downloadSelectedFiles(ctx: ToolbarActionContext<ExportDataMetadata>): void {
  const files: FileObject[] = ctx.selectedItems
    .filter((item) => item.executeStatus.value === EXECUTE_STATUS_TYPE.SUCCESS)
    .map((item) => item.metadata)
    .map((metadata) => metadata.data as FileObject)
  AttachmentService.downloads(files)
}

/**
 * 我的导出（`UserExport.vue`，非 Home 路由但同形）。核心在 `user-export.page.ts`，这里只写列表形态。
 *
 * 单行下载 / 批量下载都是**本业务自己的动作**（pro 只预置 add / deleteSelected），
 * 批量下载读 `ctx.selectedItems`，不需要页面壳喂选择态。
 */
export const userExportHomePage = defineHomePage<ExportDataMetadata, ExportDataMetadata>(
  userExportCore,
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
      {key: 'creationTime', width: 210, format: 'dateTime'},
      {key: 'filename', width: 400},
      {key: 'type', width: 120, search: defineSearchProps('select')},
      {key: 'size', width: 150, format: 'byte'},
      {key: 'executeStatus', width: 210, search: defineSearchProps('select')},
      {key: 'successTime', width: 210, format: 'dateTime'},
      {key: 'expiresTime', width: 210, format: 'dateTime'},
    ],
    recordActions: [
      {
        id: 'download',
        permission: true,
        label: () => i18n.global.t('common.download.text'),
        icon: () => renderIconFont('loncra-download', 'align'),
        run: downloadFile,
      },
    ],
    toolbarActions: [
      {
        id: 'downloadSelected',
        permission: true,
        label: (ctx) => i18n.global.t('common.download.selected', {count: ctx.selectedItems.length}),
        enabled: (ctx) =>
          ctx.selectedItems.some((item) => item.executeStatus.value === EXECUTE_STATUS_TYPE.SUCCESS),
        icon: () => renderIconFont('loncra-download', 'align'),
        run: downloadSelectedFiles,
      },
    ],
  },
)
