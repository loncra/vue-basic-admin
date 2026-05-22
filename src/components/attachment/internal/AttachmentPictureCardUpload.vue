<script setup lang="ts">

import type {AttachmentFileItem} from "@/types/composables/attachmentUpload.ts";
import LAttachmentPreview from "@/components/attachment/AttachmentPreview.vue";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants/systemConstant.ts";
import {useAttachmentUploadFiles} from "@/composables/attachment/useAttachmentUploadFiles.js";
import {useSlots} from "vue";

defineOptions({
  name: 'LAttachmentPictureCardUpload',
})

const props = withDefaults(defineProps<{
  multiple?: boolean
  accept?:string
  preview?:boolean
  maxCount?:number
}>(), {
  preview:false
})

const fileList = defineModel<AttachmentFileItem[]>('fileList', {default:() => []})
const {uploadFiles} = useAttachmentUploadFiles(fileList)

const slot = useSlots()

</script>

<template>
  <div>
    <l-attachment-preview
      v-model:file-list="uploadFiles"
      :preview="preview"
      :mode="ATTACHMENT_PREVIEW_MODE.PICTURE_CARD"
    >
      <template #pictureCardAfter v-if="!props.maxCount || uploadFiles.length < props.maxCount || props.preview">
        <a-upload
          v-bind="$attrs"
          list-type="picture-card"
          v-model:file-list="uploadFiles"
          :before-upload="() => false"
          :show-upload-list="false"
          :max-count="props.maxCount"
          :multiple="props.multiple"
          :accept="props.accept"
        >
          <a-space orientation="vertical">
            <a-typography-text type="secondary">
              <icon-font class="text-3xl" type="icon-add" />
            </a-typography-text>
            <a-typography-text type="secondary" v-if="props.maxCount && props.maxCount > 1">
              {{ uploadFiles.length }} / {{ props.maxCount }}
            </a-typography-text>
          </a-space>
        </a-upload>
      </template>
      <template v-if="slot.itemRender" #itemRender="{file}">
        <slot name="itemRender" :file="file" />
      </template>
    </l-attachment-preview>
  </div>
</template>
