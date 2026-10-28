import {
  defineHomePage,
  executeStatusCell,
  type RecordActionContext,
  type ToolbarActionContext,
} from '@loncra/antdv-pro'
import type {ExportDataMetadata, FileObject} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import {EXECUTE_STATUS_TYPE} from '@loncra/client/commons'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {userExportCore} from './user-export.page'

function downloadFile(ctx: RecordActionContext<ExportDataMetadata>): void {
  const data = ctx.record?.metadata?.data as FileObject | undefined
  if (!data?.bucketName || !data.objectName) {
    return
  }
  AttachmentService.download(data.bucketName, data.objectName)
}

function downloadSelectedFiles(ctx: ToolbarActionContext<ExportDataMetadata>): void {
  const files: FileObject[] = ctx.selectedItems
    .filter((item) => item.executeStatus.value === EXECUTE_STATUS_TYPE.SUCCESS)
    .map((item) => item.metadata)
    .map((metadata) => metadata.data as FileObject)
  AttachmentService.downloads(files)
}

export const userExportHomePage = defineHomePage<ExportDataMetadata, ExportDataMetadata>(
  userExportCore,
  {
    authority: {delete: true},
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {key: 'creationTime', width: 210, format: 'dateTime'},
      {key: 'filename', width: 400},
      {key: 'type', width: 120, search: defineSearchProps('select')},
      {key: 'size', width: 150, format: 'byte'},
      {key: 'executeStatus', width: 210, render: executeStatusCell(), search: defineSearchProps('select')},
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
