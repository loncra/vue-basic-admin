<script setup lang="ts">

import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, useSlots} from "vue";
import LAttachmentPreview from "@/components/attachment/AttachmentPreview.vue";
import type {
  AttachmentDraggerUploadProps,
  AttachmentFileItem,
} from "@/types/composables/attachmentUpload.ts";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants/systemConstant.ts";
import {useAttachmentUploadFiles} from "@/composables/attachment/useAttachmentUploadFiles.js";
import type {UploadChangeParam} from "antdv-next";

defineOptions({
  name: 'LAttachmentDraggerUpload',
})

const props = withDefaults(defineProps<AttachmentDraggerUploadProps>(), {
  mode: ATTACHMENT_PREVIEW_MODE.LIST,
  preview:false,
  disabled:false,
  changeThumbUrl: true
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const fileList = defineModel<AttachmentFileItem[]>('fileList', {default:() => []})
const {uploadFiles} = useAttachmentUploadFiles(fileList)
const slots = useSlots();

const emit = defineEmits<{
  change: [info: UploadChangeParam]
}>()

function onChange(info: UploadChangeParam) {
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
    :change-thumb-url="changeThumbUrl"
    :classes="props.classes"
    :styles="props.styles"
    :preview="preview"
    :mode="props.mode"
  >
    <template #listBefore v-if="!props.maxCount || uploadFiles.length < props.maxCount || props.preview">
      <a-upload-dragger
        v-bind="$attrs"
        :classes="uploadClasses"
        :styles="uploadStyles"
        :max-count="props.maxCount"
        :multiple="props.multiple"
        :accept="props.accept"
        v-if="!preview && !props.disabled"
        v-model:file-list="uploadFiles"
        :before-upload="() => false"
        :show-upload-list="false"
        @change="onChange"
      >
        <a-space orientation="vertical">
          <a-typography-title :level="2" class="m-0">
            <icon-font type="loncra-upload" />
          </a-typography-title>
          <a-typography-title :level="5" class="m-0">
            {{globalProperties.$t('attachment.dragger.title')}}
          </a-typography-title>
          <a-typography-text type="secondary">
            {{globalProperties.$t('attachment.dragger.subTitle', {maxCount: props.maxCount, count:uploadFiles.length})}}
          </a-typography-text>
        </a-space>
      </a-upload-dragger>
    </template>
    <template v-if="slots.itemRender" #itemRender="{file}">
      <slot name="itemRender" :file="file" />
    </template>
    <template #itemTitle="{file}" v-if="slots.itemTitle" >
      <slot name="itemTitle" :file="file" />
    </template>
    <template #itemDescription="{file}" v-if="slots.itemDescription">
      <slot name="itemDescription" :file="file" />
    </template>
  </l-attachment-preview>
</template>
