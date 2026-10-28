import {ref} from 'vue'
import {
  AttachmentService,
  type ObjectItemInfo,
  RESOURCE_SERVER_ATTACHMENT_AUTHORITY,
} from '@loncra/client/resource'
import {
  type ActionAppApis,
  defineHomePage,
  type RecordActionDefinition,
  type ToolbarActionDefinition,
} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {fileManagerCore} from './file-manager.page'

export const fileManagerBucket = ref('')

const objectsOf = (records: ObjectItemInfo[]) =>
  records.map((item) => ({bucketName: fileManagerBucket.value, objectName: item.objectName}))

function removeObjects(app: ActionAppApis<ObjectItemInfo>, records: ObjectItemInfo[]): void {
  if (records.length === 0) {
    return
  }
  app.modal.confirm({
    title: i18n.global.t('common.delete.confirmTitle'),
    content:
      records.length === 1
        ? i18n.global.t('common.delete.confirmSingle')
        : i18n.global.t('common.delete.confirmBatch', {count: records.length}),
    onOk: async () => {
      const result = await AttachmentService.removeAttachment(objectsOf(records))
      app.message.success(result.message)
      await app.collection.fetchDataSource()
    },
  })
}

const download: RecordActionDefinition<ObjectItemInfo> = {
  id: 'download',
  permission: true,
  label: () => i18n.global.t('common.download.text'),
  icon: () => renderIconFont('loncra-download'),
  run: (ctx) => {
    if (!ctx.record) {
      return
    }
    AttachmentService.download(fileManagerBucket.value, ctx.record.objectName)
  },
}

const remove: RecordActionDefinition<ObjectItemInfo> = {
  id: 'delete',
  permission: RESOURCE_SERVER_ATTACHMENT_AUTHORITY.DELETE,
  label: () => i18n.global.t('common.delete.text'),
  icon: () => renderIconFont('loncra-archive-x'),
  run: (ctx) => {
    if (!ctx.record) {
      return
    }
    removeObjects(ctx.app, [ctx.record])
  },
}

const downloadSelected: ToolbarActionDefinition<ObjectItemInfo> = {
  id: 'downloadSelected',
  permission: true,
  label: (ctx) => i18n.global.t('common.download.selected', {count: ctx.selectedItems.length}),
  enabled: () => true,
  icon: () => renderIconFont('loncra-download'),
  run: (ctx) => AttachmentService.downloads(objectsOf(ctx.selectedItems)),
}

const deleteSelected: ToolbarActionDefinition<ObjectItemInfo> = {
  id: 'deleteSelected',
  permission: RESOURCE_SERVER_ATTACHMENT_AUTHORITY.DELETE,
  label: (ctx) => i18n.global.t('common.delete.selected', {count: ctx.selectedItems.length}),
  enabled: () => true,
  icon: () => renderIconFont('loncra-archive-x'),
  run: (ctx) => removeObjects(ctx.app, ctx.selectedItems),
}

export const fileManagerHomePage = defineHomePage(fileManagerCore, {
  rowSelection: {fixed: true, type: 'checkbox'},
  columns: [
    {
      key: 'filename',
      labelKey: 'resourceServer.attachment.filename',
      width: 650,
      ellipsis: true,
      search: defineSearchProps('input'),
    },
    {key: 'uploader', labelKey: 'common.owner', width: 200, ellipsis: true},
    {key: 'size', labelKey: 'resourceServer.attachment.fileSize', width: 150, ellipsis: true},
    {
      key: 'lastModified',
      labelKey: 'resourceServer.attachment.lastModified',
      width: 210,
      ellipsis: true,
    },
  ],
  recordActions: [download, remove],
  toolbarActions: [downloadSelected, deleteSelected],
})
