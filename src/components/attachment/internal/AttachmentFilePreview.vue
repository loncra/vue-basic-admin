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
  enabledDownload: true,
  tooltipFilename:true,
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
  if (props.file.type?.includes("image/")) {
    return 'icon-picture'
  } else if (props.file?.type?.includes("video/")) {
    return 'icon-video'
  } else {
    return 'icon-order-upload'
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
      'group relative shrink-0 overflow-hidden rounded border border-border-secondary',
      itemClass,
    ]"
    :style="itemStyle"
  >

    <slot name="itemRender" v-if="slots.itemRender" :file="file" />
    <a-tooltip v-else :title="tooltipFilename ? file.name : null">
      <l-basic-image
        v-if="file.thumbUrl"
        class="size-full object-cover"
        :src="file.thumbUrl"
      >
        <template #cover>
          <a-space >
            <a-button size="small" @click.stop="onClickPreview" type="text" class="text-white! p-0">
              <icon-font type="icon-view" />
            </a-button>
            <a-button size="small" v-if="enabledDelete" @click.stop="onRemove" type="text" class="text-white! p-0" >
              <icon-font type="icon-delete" />
            </a-button>
            <a-button size="small" v-if="file.response" @click.stop="onDownload(file.response)" type="text" class="text-white! p-0" >
              <icon-font type="icon-download" />
            </a-button>
          </a-space>
        </template>
      </l-basic-image>
      <div v-else class="flex items-center justify-center h-full w-full">
        <icon-font class="text-2xl" :type="getFileIcon()" />
      </div>
    </a-tooltip>
  </div>
</template>
