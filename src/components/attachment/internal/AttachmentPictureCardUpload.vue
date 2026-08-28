<script setup lang="ts">

import type {
  AttachmentFileItem,
  AttachmentPictureCardUploadProps,
} from "@/types/composables/attachmentUpload.ts";
import LAttachmentPreview from "@/components/attachment/AttachmentPreview.vue";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants";
import {useAttachmentUploadFiles} from "@/composables/attachment/useAttachmentUploadFiles.js";
import {computed, useSlots} from "vue";
import type {UploadChangeParam} from "antdv-next";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import type {ObjectWriteResult} from "@/types/apis";

defineOptions({
  name: 'LAttachmentPictureCardUpload',
})

const props = withDefaults(defineProps<AttachmentPictureCardUploadProps>(), {
  mode: ATTACHMENT_PREVIEW_MODE.PICTURE_CARD,
  preview:false,
  showFilename: true,
  changeThumbUrl: true
})

const fileList = defineModel<AttachmentFileItem[]>('fileList', {default:() => []})

const {uploadFiles, antdFileList, onAntdFileListChange} = useAttachmentUploadFiles(fileList)

const slots = useSlots()

const emit = defineEmits<{
  change: [info: UploadChangeParam]
  remove: [file:UploadFile<ObjectWriteResult>]
}>()

function onChange(info: UploadChangeParam) {
  onAntdFileListChange(info)
  emit('change', info)
}

const uploadClasses = computed(() => ({
  trigger: props.classes?.trigger,
}))

const uploadStyles = computed(() => ({
  trigger: props.styles?.trigger,
}))

</script>

<template>

  <l-attachment-preview
    v-model:file-list="uploadFiles"
    :preview="props.preview"
    :classes="props.classes"
    :styles="props.styles"
    :mode="ATTACHMENT_PREVIEW_MODE.PICTURE_CARD"
    :disabled="disabled"
    :show-filename="props.showFilename"
    :change-thumb-url="changeThumbUrl"
    :can-preview="props.canPreview"
    :can-delete="props.canDelete"
    :can-download="props.canDownload"
    @remove="(file) => emit('remove', file)"
  >

    <template
      #pictureCardAfter="{ showMeta }"
      v-if="!props.maxCount || uploadFiles.length < props.maxCount || props.preview"
    >
      <span
        v-if="!preview && !props.disabled"
        class="inline-flex flex-col p-xs border border-dashed border-border-secondary rounded-lg"
      >
        <a-upload
          v-bind="$attrs"
          :class="[
            'block overflow-hidden [&_.ant-upload]:m-0 [&_.ant-upload]:block [&_.ant-upload]:size-full cursor-pointer w-[84px]',
            props.maxCount && props.maxCount > 1 ? 'h-[84px]' : 'h-full'
          ]"
          :classes="uploadClasses"
          :styles="uploadStyles"
          :file-list="antdFileList"
          :before-upload="() => false"
          :show-upload-list="false"
          :max-count="props.maxCount"
          :multiple="props.multiple"
          :accept="props.accept"
          @change="onChange"
        >
          <span :class="['inline-flex flex-col items-center justify-center overflow-hidden',props.maxCount && props.maxCount > 1 ? 'h-[84px] w-[84px]' : 'size-full']">
            <a-typography-text type="secondary">
              <icon-font class="text-3xl" type="loncra-file-plus" />
            </a-typography-text>
            <slot name="uploadDescription" />
          </span>
        </a-upload>
        <span
          v-if="showMeta && props.maxCount && props.maxCount > 1"
          :class="['mt-1 flex w-[84px] min-w-0 flex-col gap-1 overflow-hidden', props.classes?.meta]"
        >
          <a-typography-text type="secondary" ellipsis class="block w-full text-center">
            {{ uploadFiles.length }} / {{ props.maxCount }}
          </a-typography-text>
        </span>
      </span>
    </template>
    <template v-if="slots.itemRender" #itemRender="{file}">
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
  </l-attachment-preview>

</template>
