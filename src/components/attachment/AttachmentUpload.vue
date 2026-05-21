<script setup lang="ts">

import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref, watch} from "vue";
import {useFormItemContext} from "antdv-next/dist/form/context";
import type {ObjectWriteResult} from "@/types/apis";
import {ATTACHMENT_UPLOAD_MODE} from "@/constants/systemConstant.ts";
import LAttachmentDraggerUpload from "@/components/attachment/internal/AttachmentDraggerUpload.vue";
import type {AttachmentUploadMode} from "@/types/composables/attachmentUpload.ts";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import LAttachmentPictureCardUpload
  from "@/components/attachment/internal/AttachmentPictureCardUpload.vue";

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
  maxCount:20
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const uploadOptionsRef = ref<Record<string, unknown>>({})

const spin = defineModel<{
  description:string | undefined,
  spinning:boolean
}>('spin', {default:() => ({spinning:false})});

const value = defineModel<UploadFile[] | ObjectWriteResult[]>('value', {default:() => []});

const formItemContext = useFormItemContext()

watch(value, () => {
  formItemContext?.triggerChange()
}, {deep: true})

function upload() {

}

function mounted() {
  uploadOptionsRef.value = {...props.uploadOptions || {}, param:{},headers:{}}
  if (spin.value.description) {
    spin.value.description = globalProperties.$t('attachment.uploading')
  }
}

onMounted(mounted)

defineExpose({
  upload
})

</script>

<template>
  <a-spin :description="spin.description" :spinning="spin.spinning">
    <l-attachment-dragger-upload v-model:file-list="value" :preview="preview" v-bind="$attrs" :maxCount="maxCount" :multiple="multiple" :accept="accept" v-if="mode === ATTACHMENT_UPLOAD_MODE.DRAGGER" />
    <l-attachment-picture-card-upload v-model:file-list="value" :preview="preview" v-bind="$attrs" :maxCount="maxCount" :multiple="multiple" :accept="accept" v-else-if="mode === ATTACHMENT_UPLOAD_MODE.PICTURE_CARD"/>
  </a-spin>
</template>
