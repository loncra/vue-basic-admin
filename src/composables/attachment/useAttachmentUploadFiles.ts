import {
  applyAttachmentDirectoryProgress,
  buildAttachmentPathTree,
  collectAttachmentFileLeaves,
  convertUploadFiles,
} from '@/utils'
import type {AttachmentFileItem, AttachmentPathItem,} from '@/types/composables/attachmentUpload.ts'
import {computed, nextTick, ref, type Ref, watch} from 'vue'
import type {UploadChangeParam} from 'antdv-next'

/**
 * 表单侧 fileList 与展示树同步。
 * Preview 绑树上的顶层节点（选文件夹时通常只有一项）；
 * a-upload 只吃真实文件叶子，避免把目录节点写进 antd fileList。
 */
export function useAttachmentUploadFiles(
  fileList: Ref<AttachmentFileItem[] | undefined>,
) {
  const uploadFiles = ref<AttachmentPathItem[]>([])
  let syncingFromChild = false
  let ignoreAntdChange = false

  function toTree(list: AttachmentFileItem[] | undefined): AttachmentPathItem[] {
    return buildAttachmentPathTree(convertUploadFiles(Array.isArray(list) ? list : []))
  }

  watch(
    fileList,
    (list) => {
      if (syncingFromChild) {
        return
      }
      uploadFiles.value = toTree(list)
    },
    {immediate: true},
  )

  watch(
    uploadFiles,
    (list) => {
      applyAttachmentDirectoryProgress(list)
      syncingFromChild = true
      ignoreAntdChange = true
      fileList.value = list
      nextTick().then(() => {
        syncingFromChild = false
        ignoreAntdChange = false
      })
    },
    {deep: true},
  )

  const antdFileList = computed(() => collectAttachmentFileLeaves(uploadFiles.value))

  function onAntdFileListChange(info: UploadChangeParam) {
    if (ignoreAntdChange) {
      return
    }
    const incoming = info.fileList
    const current = antdFileList.value
    const same =
      incoming.length === current.length &&
      incoming.every((file, index) => file.uid === current[index]?.uid)
    if (!same) {
      uploadFiles.value = buildAttachmentPathTree(incoming)
    }
  }

  return {uploadFiles, antdFileList, onAntdFileListChange}
}
