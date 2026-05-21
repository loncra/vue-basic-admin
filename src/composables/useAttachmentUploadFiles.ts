import {AttachmentService} from '@/apis'
import {convertUploadFiles} from '@/utils'
import type {ObjectWriteResult} from '@/types/apis'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {nextTick, ref, type Ref, watch} from 'vue'

/**
 * 将表单 value（UploadFile[] | ObjectWriteResult[]）与内部 UploadFile[] 双向同步，
 * 避免 preview 使用 computed 单向绑定导致删除后 UI 被旧数据覆盖。
 */
export function useAttachmentUploadFiles(
  fileList: Ref<UploadFile[] | ObjectWriteResult[] | undefined>,
  service = new AttachmentService(),
) {
  const uploadFiles = ref<UploadFile[]>([])
  let syncingFromChild = false

  watch(
    fileList,
    (list) => {
      if (syncingFromChild) {
        return
      }
      uploadFiles.value = convertUploadFiles(Array.isArray(list) ? list : [], service)
    },
    {immediate: true, deep: true},
  )

  watch(
    uploadFiles,
    (list) => {
      syncingFromChild = true
      fileList.value = [...list]
      nextTick(() => {
        syncingFromChild = false
      })
    },
    {deep: true},
  )

  return {uploadFiles}
}
