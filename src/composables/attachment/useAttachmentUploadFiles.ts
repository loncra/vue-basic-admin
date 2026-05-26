import {AttachmentService} from '@/apis'
import {convertUploadFiles, displayUploadFileToListItem} from '@/utils'
import type {AttachmentFileItem,} from '@/types/composables/attachmentUpload.ts'
import {nextTick, ref, type Ref, watch} from 'vue'
import type {UploadFile} from "antdv-next/dist/upload/interface";
import type {ObjectWriteResult} from "@/types/apis";

/**
 * 将表单 fileList（数据层）与 uploadFiles（展示层）同步。
 * 展示层变更写回时通过 objectWriteResult 还原为 ObjectWriteResult，避免污染 entity。
 */
export function useAttachmentUploadFiles(
  fileList: Ref<AttachmentFileItem[] | undefined>,
  service = new AttachmentService(),
) {
  const uploadFiles = ref<UploadFile<ObjectWriteResult>[]>([])
  let syncingFromChild = false

  watch(
    fileList,
    (list) => {
      if (syncingFromChild) {
        return
      }
      uploadFiles.value = convertUploadFiles(Array.isArray(list) ? list : [])
    },
    {immediate: true, deep: true},
  )

  watch(
    uploadFiles,
    (list) => {
      syncingFromChild = true
      fileList.value = list.map(displayUploadFileToListItem)
      nextTick().then(r => syncingFromChild = false)
    },
    {deep: true},
  )

  return {uploadFiles}
}
