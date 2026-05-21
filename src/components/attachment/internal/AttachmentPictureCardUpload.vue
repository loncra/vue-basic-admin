<script setup lang="ts">

import type {UploadFile} from "antdv-next/dist/upload/interface";
import LAttachmentPreview from "@/components/attachment/AttachmentPreview.vue";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants/systemConstant.ts";
import type {ObjectWriteResult} from "@/types/apis";
import {useAttachmentUploadFiles} from "@/composables/useAttachmentUploadFiles.ts";

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

const fileList = defineModel<UploadFile[] | ObjectWriteResult[]>('fileList', {default:() => []})
const {uploadFiles} = useAttachmentUploadFiles(fileList)

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
          class="avatar-uploader"
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
            <a-typography-text type="secondary" v-if="props.maxCount">
              {{ uploadFiles.length }} / {{ props.maxCount }}
            </a-typography-text>
          </a-space>
        </a-upload>
      </template>
    </l-attachment-preview>
  </div>
</template>
