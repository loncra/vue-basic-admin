<script setup lang="ts">

import type {UploadFile} from "antdv-next/dist/upload/interface";
import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance} from "vue";
import LAttachmentPreview from "@/components/attachment/AttachmentPreview.vue";
import type {AttachmentPreviewMode} from "@/types/composables/attachmentUpload.ts";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants/systemConstant.ts";
import type {ObjectWriteResult} from "@/types/apis";
import {useAttachmentUploadFiles} from "@/composables/useAttachmentUploadFiles.ts";

defineOptions({
  name: 'LAttachmentDraggerUpload',
})

const props = withDefaults(defineProps<{
  previewMode?:AttachmentPreviewMode,
  multiple?: boolean
  accept?:string
  preview?:boolean
  maxCount?:number
}>(), {
  previewMode: ATTACHMENT_PREVIEW_MODE.LIST,
  preview:false
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const fileList = defineModel<UploadFile[] | ObjectWriteResult[]>('fileList', {default:() => []})
const {uploadFiles} = useAttachmentUploadFiles(fileList)

</script>

<template>
  <div>
    <a-upload-dragger
      v-bind="$attrs"
      :max-count="props.maxCount"
      :multiple="props.multiple"
      :accept="props.accept"
      class="mb-sm"
      v-model:file-list="uploadFiles"
      :before-upload="() => false"
      :show-upload-list="false"
    >
      <a-space orientation="vertical">
        <a-typography-title :level="2" class="m-0">
          <icon-font type="icon-upload" />
        </a-typography-title>
        <a-typography-title :level="5" class="m-0">
          {{globalProperties.$t('attachment.dragger.title')}}
        </a-typography-title>
        <a-typography-text type="secondary">
          {{globalProperties.$t('attachment.dragger.subTitle')}}
        </a-typography-text>
      </a-space>
    </a-upload-dragger>
    <l-attachment-preview
      v-model:file-list="uploadFiles"
      :preview="preview"
      :mode="props.previewMode"
    />
  </div>
</template>
