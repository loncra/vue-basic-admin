<script setup lang="ts">

import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, useSlots} from "vue";
import LAttachmentPreview from "@/components/attachment/AttachmentPreview.vue";
import type {
  AttachmentFileItem,
  AttachmentPreviewMode
} from "@/types/composables/attachmentUpload.ts";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants/systemConstant.ts";
import {useAttachmentUploadFiles} from "@/composables/attachment/useAttachmentUploadFiles.js";

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

const fileList = defineModel<AttachmentFileItem[]>('fileList', {default:() => []})
const {uploadFiles} = useAttachmentUploadFiles(fileList)
const slot = useSlots();

</script>

<template>
  <div>

    <l-attachment-preview
      v-model:file-list="uploadFiles"
      :preview="preview"
      :mode="props.previewMode"
    >
      <template #listBefore v-if="!props.maxCount || uploadFiles.length < props.maxCount || props.preview">
        <a-upload-dragger
          v-bind="$attrs"
          :max-count="props.maxCount"
          :multiple="props.multiple"
          :accept="props.accept"
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
      </template>
      <template v-if="slot.itemRender" #itemRender="{file}">
        <slot name="itemRender" :file="file" />
      </template>
    </l-attachment-preview>
  </div>
</template>
