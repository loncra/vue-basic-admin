<script setup lang="ts">

import {requireNonNullOrUndefined} from "@/utils";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  ref,
  toRef,
  useSlots,
  watch
} from "vue";
import { useMergeSemantic, useToArr, useToProps } from 'antdv-next/dist/_util/hooks/useMergeSemantic'
import {useFormItemContext} from "antdv-next/dist/form/context";
import type {ObjectWriteResult} from "@/types/apis";
import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from "@/constants/systemConstant.ts";
import LAttachmentDraggerUpload from "@/components/attachment/internal/AttachmentDraggerUpload.vue";
import type {
  AttachmentFileItem,
  AttachmentUploadExecutorOptions,
  AttachmentUploadProps,
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

const props = withDefaults(defineProps<AttachmentUploadProps>(),{
  postFilename:'file',
  autoUpload:false,
  mode:ATTACHMENT_UPLOAD_MODE.PICTURE_CARD,
  promiseLimit:3,
  bucket:'user.file',
  preview: false,
  multiple:true,
  maxCount:20
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
const slots = useSlots()

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
    await Promise.all(
      pending.map(async (file) => file.response = await uploadAttachmentFile(attachmentService, file, props.bucket, options)),
    )

    const results = list
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

    <a-spin :description="spin.description" :spinning="spin.spinning" v-if="props.mode !== ATTACHMENT_UPLOAD_MODE.CUSTOMIZE" >
      <l-attachment-dragger-upload
        v-model:file-list="fileList"
        :preview="props.preview"
        v-bind="$attrs"
        :classes="mergedClasses"
        :styles="mergedStyles"
        :max-count="props.maxCount"
        :multiple="props.multiple"
        :accept="props.accept"
        :mode="props?.previewMode || ATTACHMENT_PREVIEW_MODE.LIST"
        v-if="props.mode === ATTACHMENT_UPLOAD_MODE.DRAGGER"
      >
        <template #itemRender="{file}" v-if="slots.itemRender">
          <slot name="itemRender" :file="file" />
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
        v-bind="$attrs"
        :max-count="props.maxCount"
        :multiple="props.multiple"
        :accept="props.accept"
        :classes="mergedClasses"
        :styles="mergedStyles"
        :mode="props?.previewMode || ATTACHMENT_PREVIEW_MODE.PICTURE_CARD"
        v-else-if="props.mode === ATTACHMENT_UPLOAD_MODE.PICTURE_CARD"
      >
        <template #uploadDescription v-if="slots.uploadDescription">
          <slot name="uploadDescription" />
        </template>
        <template #itemRender="{file}" v-if="slots.itemRender">
          <slot name="itemRender" :file="file" />
        </template>
        <template #itemTitle="{file}" v-if="slots.itemTitle" >
          <slot name="itemTitle" :file="file" />
        </template>
        <template #itemDescription="{file}" v-if="slots.itemDescription">
          <slot name="itemDescription" :file="file" />
        </template>
      </l-attachment-picture-card-upload>
    </a-spin>
    <a-upload
      v-else
      v-bind="$attrs"
      :accept="props.accept"
      :action="props.action"
      :max-count="props.maxCount"
      :multiple="props.multiple"
    >
      <slot/>
    </a-upload>
  </div>
</template>
