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

    <a-spin :description="spin.description" :spinning="spin.spinning">
      <l-attachment-dragger-upload
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
