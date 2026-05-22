<script setup lang="ts">

import {requireNonNullOrUndefined} from "@/utils";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  nextTick,
  onMounted,
  ref,
  useSlots,
  watch
} from "vue";
import {useFormItemContext} from "antdv-next/dist/form/context";
import type {ObjectWriteResult} from "@/types/apis";
import {ATTACHMENT_UPLOAD_MODE} from "@/constants/systemConstant.ts";
import LAttachmentDraggerUpload from "@/components/attachment/internal/AttachmentDraggerUpload.vue";
import LCropperModal from "@/components/basic/CropperModal.vue";
import type {
  AttachmentFileItem,
  AttachmentUploadExecutorOptions,
  AttachmentUploadMode,
  AttachmentValue
} from "@/types/composables/attachmentUpload.ts";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import LAttachmentPictureCardUpload
  from "@/components/attachment/internal/AttachmentPictureCardUpload.vue";
import {AttachmentService} from "@/apis/resource-server/attachmentService.ts";
import {
  uploadFile as uploadAttachmentFile
} from "@/composables/attachment/useAttachmentUploadExecutor.js";
import {
  collectObjectWriteResults,
  denormalizeAttachmentFromList,
  detectAttachmentValueMode,
  isObjectWriteResult,
  isUploadFile,
  normalizeAttachmentToList,
} from "@/utils/fileUtils.ts";
import type {CropperModalProps} from "@/types/composables";
import type { CropperModalCroppedFile, CropperModalItem } from "@/types/composables/cropperModal.ts";
import type { UploadChangeParam } from "antdv-next";
import type { VcFile } from "antdv-next/dist/upload/interface";

defineOptions({
  name: 'LAttachmentUpload',
})

const props = withDefaults(defineProps<{
  mode?:AttachmentUploadMode
  postFilename?:string
  autoUpload?:boolean
  action?:string
  promiseLimit?:number
  bucket?:string
  preview?:boolean
  uploadOptions?:Record<string, unknown>,
  multiple?: boolean
  accept?:string
  maxCount?:number
  cropper?:CropperModalProps
}>(),{
  postFilename:'file',
  autoUpload:false,
  mode:ATTACHMENT_UPLOAD_MODE.PICTURE_CARD,
  promiseLimit:3,
  bucket:'user.file',
  preview: false,
  multiple:true,
  maxCount:20,
  cropper:() => ({
    aspectRatio: 750 / 360,
    compressQuality: 0.5,
    outputScales: [{ scale: 1 }, { scale: 0.5, suffix: '@half' }],
  }),
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const attachmentService = new AttachmentService()
const uploadOptionsRef = ref<Record<string, unknown>>({})

const spin = defineModel<{
  description:string | undefined,
  spinning:boolean
}>('spin', {default:() => ({spinning:false})});

const value = defineModel<AttachmentValue>('value');
const fileList = ref<AttachmentFileItem[]>([])
const syncing = ref<boolean>(false)
const slot = useSlots()

const formItemContext = useFormItemContext()
const cropperModalRef = ref();
const cropperPendingUids = ref<string[]>([])

watch(value, (v) => {
  if (syncing.value) {
    return
  }
  fileList.value = normalizeAttachmentToList(v ?? undefined)
}, {immediate: true, deep: true})

watch(fileList, (list) => {
  syncing.value = true
  value.value = denormalizeAttachmentFromList(list, value.value ?? undefined, props.maxCount)
  nextTick(() => syncing.value = false)
}, {deep: true})

watch(value, () => {
  formItemContext?.triggerChange()
}, {deep: true})

function buildExecutorOptions(): AttachmentUploadExecutorOptions {
  return {
    postFilename: props.postFilename,
    promiseLimit: props.promiseLimit,
    param: uploadOptionsRef.value.param as Record<string, unknown> | undefined,
    headers: uploadOptionsRef.value.headers as Record<string, string> | undefined,
  }
}

function resolveUploadResult(results: ObjectWriteResult[]): ObjectWriteResult | ObjectWriteResult[] | undefined {
  const mode = detectAttachmentValueMode(value.value ?? undefined, props.maxCount)
  if (mode === 'single') {
    return results[0]
  }
  return results
}

async function upload(): Promise<ObjectWriteResult | ObjectWriteResult[] | undefined> {
  const list = fileList.value
  const existing = collectObjectWriteResults(list)
  const pending = list.filter(
    (item): item is UploadFile => isUploadFile(item) && !!item.originFileObj,
  )

  if (pending.length === 0) {
    return resolveUploadResult(existing)
  }

  spin.value = {
    ...spin.value,
    spinning: true,
    description: globalProperties.$t('attachment.uploading'),
  }

  try {
    const options = buildExecutorOptions()
    const uploadedMap = new Map<string, ObjectWriteResult>()

    await Promise.all(
      pending.map(async (file) => {
        const result = await uploadAttachmentFile(attachmentService, file, props.bucket, options)
        uploadedMap.set(file.uid, result)
      }),
    )

    const results = list
      .map((item) => {
        if (isObjectWriteResult(item)) {
          return item
        }
        if (isUploadFile(item) && uploadedMap.has(item.uid)) {
          return uploadedMap.get(item.uid)!
        }
        return null
      })
      .filter((item): item is ObjectWriteResult => item !== null)

    syncing.value = true
    fileList.value = results
    value.value = denormalizeAttachmentFromList(results, value.value ?? undefined, props.maxCount)
    await nextTick()
    syncing.value = false

    return resolveUploadResult(results)
  } finally {
    spin.value = {...spin.value, spinning: false}
  }
}

function findCroppedOutputsForItem(
  item: CropperModalItem,
  croppedFiles: CropperModalCroppedFile[],
): CropperModalCroppedFile[] {
  return croppedFiles.filter((cropped) => (
    cropped.uid === item.uid || cropped.uid.startsWith(`${item.uid}-`)
  ))
}

function onCropperComplete(items: CropperModalItem[]) {
  const croppedFiles: CropperModalCroppedFile[] = cropperModalRef.value?.getCroppedFiles() ?? []
  if (croppedFiles.length === 0) {
    cropperPendingUids.value = []
    return
  }

  const newUploadFiles: UploadFile<ObjectWriteResult>[] = []
  for (const item of items) {
    const outputsForItem = findCroppedOutputsForItem(item, croppedFiles)
    for (const cropped of outputsForItem) {
      const outputMeta = item.outputs?.find((output) => output.scale === cropped.scale)
      const previewUrl = outputMeta?.dataUrl ?? item.cropImg
      const useOriginalUid = outputsForItem.length === 1 && cropped.scale === 1
      newUploadFiles.push({
        uid: useOriginalUid ? item.uid : cropped.uid,
        name: cropped.file.name,
        type: cropped.file.type,
        size: cropped.file.size,
        originFileObj: cropped.file as VcFile,
        thumbUrl: previewUrl,
      })
    }
  }

  syncing.value = true
  fileList.value = [...fileList.value, ...newUploadFiles]
  cropperPendingUids.value = []
  void nextTick(() => {
    syncing.value = false
  })
}

function onCropperCancel() {
  cropperPendingUids.value = []
}

async function onChange(info: UploadChangeParam) {
  if (!props.cropper || props.preview) {
    return
  }
  const newImages = info.fileList.filter(
    f => f.originFileObj && f.type?.includes('image/') && !f.url /* 新选的本地文件 */
  )
  if (newImages.length === 0) {
    return
  }
  // 先从列表里摘掉，避免未裁剪就出现在 UI 上
  cropperPendingUids.value = newImages.map(f => f.uid)
  fileList.value = fileList.value.filter(
    item => !cropperPendingUids.value.includes(isUploadFile(item) ? item.uid : '')
  )
  const files = newImages.map(f => f.originFileObj!).filter(Boolean)
  const uids = newImages.map(f => f.uid)
  await cropperModalRef.value?.open(files, uids)
}

function mounted() {
  uploadOptionsRef.value = {...props.uploadOptions || {}, param: {}, headers: {}}
}

onMounted(mounted)

defineExpose({
  upload,
  uploadFile: (file: UploadFile) => uploadAttachmentFile(
    attachmentService,
    file,
    props.bucket,
    buildExecutorOptions(),
  ),
})

</script>

<template>
  <div>
    <l-cropper-modal
      v-if="cropper"
      ref="cropperModalRef"
      :aspect-ratio="cropper.aspectRatio"
      :compress-quality="cropper.compressQuality"
      :output-mime-type="cropper.outputMimeType"
      :output-scales="cropper.outputScales"
      @complete="onCropperComplete"
      @cancel="onCropperCancel"
    />
    <a-spin :description="spin.description" :spinning="spin.spinning">
      <l-attachment-dragger-upload 
        :change-thumb-url="cropper ? false : true"
        @change="onChange"
        v-model:file-list="fileList" 
        :preview="preview" 
        v-bind="$attrs" 
        :maxCount="maxCount" 
        :multiple="multiple" 
        :accept="accept" 
        v-if="mode === ATTACHMENT_UPLOAD_MODE.DRAGGER"
      >
        <template #itemRender="{file}" v-if="slot.itemRender">
          <slot name="itemRender" :file="file" />
        </template>
      </l-attachment-dragger-upload>
      <l-attachment-picture-card-upload 
        @change="onChange"
        :change-thumb-url="cropper ? false : true"
        v-model:file-list="fileList" 
        :preview="preview" 
        v-bind="$attrs" 
        :maxCount="maxCount" 
        :multiple="multiple" 
        :accept="accept" v-else-if="mode === ATTACHMENT_UPLOAD_MODE.PICTURE_CARD"
      >
        <template #itemRender="{file}" v-if="slot.itemRender">
          <slot name="itemRender" :file="file" />
        </template>
      </l-attachment-picture-card-upload>
    </a-spin>
  </div>
</template>
