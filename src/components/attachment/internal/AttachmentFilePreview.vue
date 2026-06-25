<script setup lang="ts">

import type {UploadFile} from "antdv-next/dist/upload/interface";
import {type ComponentInternalInstance, getCurrentInstance, useSlots} from "vue";
import type {ObjectWriteResult, RestResult} from "@/types/apis";
import useApp from "antdv-next/dist/app/useApp";
import {requireNonNullOrUndefined} from "@/utils";
import {AttachmentService} from "@/apis";
import LBasicImage from "@/components/basic/BasicImage.vue";
import type {AttachmentPreviewFileProps} from "@/types/composables/attachmentUpload.ts";

defineOptions({
  name: 'LAttachmentFilePreview',
})

const props = withDefaults(defineProps<AttachmentPreviewFileProps>(),{
  enabledDelete: true,
  border:false,
  disabled:false,
  enabledDownload: true,
})

const slots = useSlots()
const {message, modal} = useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const emit = defineEmits<{
  download: [file: ObjectWriteResult]
  delete:[file: UploadFile<ObjectWriteResult>]
  preview: [file: UploadFile<ObjectWriteResult>]
}>()

function getFileIcon() {
  if (props.file?.type?.includes("image/")) {
    return 'loncra-file-image'
  } else if (props.file?.type?.includes("video/")) {
    return 'loncra-file-play'
  } else {
    return 'loncra-file-up'
  }
}

function onClickPreview() {
  emit('preview', props.file)
}

function onRemove() {
  if (props.file.response) {
    remove(props.file)
  } else {
    emit("delete", props.file)
  }
}

function remove(file: UploadFile<ObjectWriteResult>) {
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content: globalProperties.$t('common.delete.confirmSingle'),
    onOk: () => doRemove(file)
  })
}

async function doRemove(file: UploadFile<ObjectWriteResult>) {
  if (!file.response) {
    return ;
  }
  try {
    const result:RestResult<void> = await AttachmentService.removeAttachment([file.response])
    emit("delete", file)
    message.success(result.message)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

function canPreview(file:UploadFile<ObjectWriteResult>) {
  return file.type?.includes('image/') || file.type?.includes('video/')
}

function onDownload(file: ObjectWriteResult) {
  download(file);
  emit("download", file)
}

function download(file: ObjectWriteResult) {
  AttachmentService.download(file.bucketName, file.objectName);
}

defineExpose({
  download,
  remove,
})

</script>

<template>

  <span
    :class="[
      'group relative inline-block shrink-0 overflow-hidden rounded-sm border align-middle',
      border ? [
      file.status === undefined ? 'border-warning-border' : '',
      file.status === 'uploading' ? 'border-info-border' : '',
      file.status === 'done' ? 'border-success-border' : '',
      file.status === 'error' ? 'border-error-border' : '',
      ] : 'border-border-secondary',
      itemClass,
    ]"
    :style="itemStyle"
  >

    <slot name="itemRender" v-if="slots.itemRender" :file="file" />
    <l-basic-image
      :preview="false"
      v-if="file.thumbUrl"
      class="size-full object-cover"
      :src="file.thumbUrl"
      loading="lazy"
    >

    </l-basic-image>
    <span v-else class="inline-flex size-full items-center justify-center">
      <icon-font class="text-2xl" :type="getFileIcon()" />
    </span>
    <span
      v-if="!props.disabled"
      :class="'absolute gap-2 inset-0 flex items-center justify-center bg-black/30 ' + (file.status !== 'uploading' ? ' transition-opacity opacity-0 group-hover:opacity-100' : '')"
    >
      <span
        role="button"
        tabindex="-1"
        v-if="file.status !== 'uploading' && canPreview(file)"
        class="cursor-pointer p-0.5 text-white"
        @click.stop="onClickPreview"
      >
        <icon-font type="loncra-view" />
      </span>
      <span
        v-if="enabledDelete && file.status !== 'uploading'"
        role="button"
        tabindex="-1"
        class="cursor-pointer p-0.5 text-white"
        @click.stop="onRemove"
      >
        <icon-font type="loncra-archive-x" />
      </span>
      <span
        v-if="file.response && file.status !== 'uploading'"
        role="button"
        tabindex="-1"
        class="cursor-pointer p-0.5 text-white"
        @click.stop="onDownload(file.response)"
      >
        <icon-font type="loncra-download" />
      </span>
      <span class="flex flex-col gap-2 items-center justify-center opacity-75" v-else-if="!file.response && file.status === 'uploading'">
        <icon-font class="text-lg! text-white!" type="loncra-loader-pinwheel" spin/>
        <span class="text-xs! text-white!">{{file.percent + '%'}}</span>
      </span>
    </span>
  </span>
</template>
