<script setup lang="ts">

import {computed, nextTick, onMounted, ref, toRef, useSlots, watch} from "vue";
import {useMergeSemantic, useToArr, useToProps} from 'antdv-next/dist/_util/hooks/useMergeSemantic'
import {useFormItemContext} from "antdv-next/dist/form/context";
import type {ObjectWriteResult} from "@/types/apis";
import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from "@/constants";
import LAttachmentDraggerUpload from "@/components/attachment/internal/AttachmentDraggerUpload.vue";
import type {
  AttachmentFileItem,
  AttachmentPathItem,
  AttachmentUploadExecutorOptions,
  AttachmentUploadProps,
  AttachmentValue
} from "@/types/composables/attachmentUpload.ts";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import LAttachmentPictureCardUpload
  from "@/components/attachment/internal/AttachmentPictureCardUpload.vue";
import {
  uploadFile as uploadAttachmentFile
} from "@/composables/attachment/useAttachmentUploadExecutor.js";
import {
  applyAttachmentDirectoryProgress,
  collectAttachmentFileLeaves,
  denormalizeAttachmentFromList,
  detectAttachmentValueMode,
  isObjectWriteResult,
  isUploadFile,
  normalizeAttachmentToList,
} from "@/utils/fileUtils.ts";
import type {UploadChangeParam} from "antdv-next";

defineOptions({
  name: 'LAttachmentUpload',
})

const props = withDefaults(defineProps<AttachmentUploadProps>(),{
  postFilename:'file',
  autoUpload:false,
  mode:ATTACHMENT_UPLOAD_MODE.PICTURE_CARD,
  promiseLimit:3,
  bucket:'user.file',
  disabled:false,
  preview: false,
  showFilename: true,
  multiple:true
})

const uploadOptionsRef = ref<Record<string, unknown>>({})

const value = defineModel<AttachmentValue>('value');
const fileList = ref<AttachmentFileItem[]>([])
const syncing = ref<boolean>(false)
const slots = useSlots()

const emit = defineEmits<{
  remove: [file:UploadFile<ObjectWriteResult>]
  change: [info: UploadChangeParam]
}>()

const formItemContext = useFormItemContext()

watch(value, (v) => {
  if (syncing.value) {
    return
  }
  fileList.value = normalizeAttachmentToList(v ?? undefined)
}, {immediate: true})

watch(fileList, (list) => {
  syncing.value = true
  value.value = denormalizeAttachmentFromList(list, value.value ?? undefined, props.maxCount)
  nextTick(() => syncing.value = false)
}, {deep: true})

watch(value, () => {
  formItemContext?.triggerChange()
}, {deep: true})

const [mergedClasses, mergedStyles] = useMergeSemantic(
  useToArr(toRef(props, 'classes')),
  useToArr(toRef(props, 'styles')),
  useToProps(computed(() => props)),
)

function buildExecutorOptions(): AttachmentUploadExecutorOptions {
  return {
    postFilename: props.postFilename,
    promiseLimit: props.promiseLimit,
    param: uploadOptionsRef.value.param as Record<string, unknown> | undefined,
    headers: uploadOptionsRef.value.headers as Record<string, string> | undefined,
  }
}

function resolveUploadResult(results: AttachmentFileItem[]): ObjectWriteResult | ObjectWriteResult[] | undefined {
  const mode = detectAttachmentValueMode(value.value ?? undefined, props.maxCount)
  if (mode === 'single') {
    return getObjectWriteResult(results[0] as AttachmentFileItem)
  }
  return results.map(s => getObjectWriteResult(s)).filter(s => s) as ObjectWriteResult[]
}

function getObjectWriteResult(item:AttachmentFileItem): ObjectWriteResult | undefined {
  if (isObjectWriteResult(item)){
    return item
  } else if (isUploadFile(item) && item.response && item.status === 'done') {
    return item.response
  }
}

async function upload(): Promise<ObjectWriteResult | ObjectWriteResult[] | undefined> {
  const tree = fileList.value as AttachmentPathItem[]
  const leaves = collectAttachmentFileLeaves(tree)
  const existing = leaves.filter(s => isObjectWriteResult(s) || (isUploadFile(s) && s.response && s.status === 'done'))
  const pending = leaves.filter(
    (item): item is UploadFile => isUploadFile(item) && !!item.originFileObj && !item.response,
  )

  if (pending.length === 0) {
    return resolveUploadResult(existing)
  }

  const options = buildExecutorOptions()
  const stopProgressWatch = watch(
    () => pending.map((file) => [file.percent, file.status]),
    () => applyAttachmentDirectoryProgress(tree),
    {flush: 'sync'},
  )
  try {
    await Promise.all(
      pending.map(async (file) => file.response = await uploadAttachmentFile(file, props.bucket, options))
    )
  } finally {
    stopProgressWatch()
    applyAttachmentDirectoryProgress(tree)
  }

  const hasDirectory = tree.some((item) => item.type === 'directory')
  if (!hasDirectory) {
    const results = leaves
      .map((item) => {
        if (isObjectWriteResult(item)) {
          return item
        }
        if (isUploadFile(item) && item.response) {
          return item.response
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
  }

  const results = leaves
    .map((item) => getObjectWriteResult(item))
    .filter((item): item is ObjectWriteResult => item !== undefined)

  return resolveUploadResult(results)
}


function mounted() {
  uploadOptionsRef.value = {param: {}, headers: {}, ...props.uploadOptions || {}}
}

onMounted(mounted)

defineExpose({
  upload,
  uploadFile: (file: UploadFile) => uploadAttachmentFile(
    file,
    props.bucket,
    buildExecutorOptions(),
  ),
})

</script>

<template>

  <l-attachment-dragger-upload
    v-model:file-list="fileList"
    :preview="props.preview"
    v-bind="$attrs"
    :can-preview="props.canPreview"
    :can-delete="props.canDelete"
    :can-download="props.canDownload"
    :classes="mergedClasses"
    :styles="mergedStyles"
    :max-count="props.maxCount"
    :multiple="props.multiple"
    :accept="props.accept"
    :disabled="props.disabled"
    @remove="(file) => emit('remove', file)"
    @change="(info) => emit('change', info)"
    :mode="props?.previewMode || ATTACHMENT_PREVIEW_MODE.LIST"
    v-if="props.mode === ATTACHMENT_UPLOAD_MODE.DRAGGER"
  >
    <template #itemRender="{file}" v-if="slots.itemRender">
      <slot name="itemRender" :file="file" />
    </template>
    <template #itemIcon="{file}" v-if="slots.itemIcon">
      <slot name="itemIcon" :file="file" />
    </template>
    <template #itemTitle="{file}" v-if="slots.itemTitle" >
      <slot name="itemTitle" :file="file" />
    </template>
    <template #itemDescription="{file}" v-if="slots.itemDescription">
      <slot name="itemDescription" :file="file" />
    </template>
  </l-attachment-dragger-upload>

  <l-attachment-picture-card-upload
    v-model:file-list="fileList"
    :preview="props.preview"
    :can-preview="props.canPreview"
    :can-delete="props.canDelete"
    :can-download="props.canDownload"
    v-bind="$attrs"
    :disabled="props.disabled"
    :max-count="props.maxCount"
    :multiple="props.multiple"
    :accept="props.accept"
    :show-filename="props.showFilename"
    :classes="mergedClasses"
    :styles="mergedStyles"
    @remove="(file) => emit('remove', file)"
    @change="(info) => emit('change', info)"
    :mode="props?.previewMode || ATTACHMENT_PREVIEW_MODE.PICTURE_CARD"
    v-else-if="props.mode === ATTACHMENT_UPLOAD_MODE.PICTURE_CARD"
  >
    <template #uploadDescription v-if="slots.uploadDescription">
      <slot name="uploadDescription" />
    </template>
    <template #itemRender="{file}" v-if="slots.itemRender">
      <slot name="itemRender" :file="file" />
    </template>
    <template #itemIcon="{file}" v-if="slots.itemIcon">
      <slot name="itemIcon" :file="file" />
    </template>
    <template #itemTitle="{file}" v-if="slots.itemTitle" >
      <slot name="itemTitle" :file="file" />
    </template>
    <template #itemDescription="{file}" v-if="slots.itemDescription">
      <slot name="itemDescription" :file="file" />
    </template>
  </l-attachment-picture-card-upload>

  <a-upload
    v-else
    :disabled="props.disabled"
    v-bind="$attrs"
    :accept="props.accept"
    :action="props.action"
    :max-count="props.maxCount"
    :multiple="props.multiple"
  >
    <slot/>
  </a-upload>
</template>
