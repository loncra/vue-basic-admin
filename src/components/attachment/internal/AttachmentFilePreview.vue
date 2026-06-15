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
  showProgress: true,
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

  <div
    :class="[
      'group relative shrink-0 overflow-hidden rounded border',
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
    <div v-else class="flex items-center justify-center h-full w-full">
      <icon-font class="text-2xl" :type="getFileIcon()" />
    </div>
    <div
      :class="'absolute inset-0 flex items-center justify-center ' + (file.status === undefined || file.response ? ' transition-opacity bg-black/30 opacity-0 group-hover:opacity-100' : '')"
    >
      <a-space v-if="file.status === undefined || file.status !== 'uploading'">
        <a-button size="small" @click.stop="onClickPreview" type="text" class="text-white! p-0">
          <icon-font type="loncra-view" />
        </a-button>
        <a-button size="small" v-if="enabledDelete" @click.stop="onRemove" type="text" class="text-white! p-0" >
          <icon-font type="loncra-archive-x" />
        </a-button>
        <a-button size="small" v-if="file.response" @click.stop="onDownload(file.response)" type="text" class="text-white! p-0" >
          <icon-font type="loncra-download" />
        </a-button>
      </a-space>
      <div class="p-xs w-full" v-else-if="!file.response && showProgress">
        <a-progress :percent="file.percent" size="small" />
      </div>
    </div>
  </div>
</template>
