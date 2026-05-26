<script setup lang="ts">

import type {UploadFile} from "antdv-next/dist/upload/interface";
import {type ComponentInternalInstance, getCurrentInstance, useSlots} from "vue";
import type {ObjectWriteResult, RestResult} from "@/types/apis";
import useApp from "antdv-next/dist/app/useApp";
import {requireNonNullOrUndefined} from "@/utils";
import {AttachmentService} from "@/apis";
import LBasicImage from "@/components/basic/BasicImage.vue";

defineOptions({
  name: 'LAttachmentFilePreview',
})

const props = withDefaults(defineProps<{
  file: UploadFile
  preview?:boolean
  height?:string
  width?:string
  enabledDelete?:boolean
  enabledDownload?:boolean
}>(),{
  preview:false,
  height:'100%',
  width:'100%',
  enabledDelete: true,
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
    class="group relative size-16 shrink-0 overflow-hidden rounded border border-border-secondary"
    :style="{width:props.width, height: props.height}"
  >

    <slot name="itemRender" v-if="slots.itemRender" :file="file" />
    <template v-else>
      <l-basic-image
        v-if="file.thumbUrl"
        class="size-full object-cover"
        :alt="file.name"
        :src="file.thumbUrl"
      />
      <div v-else class="flex items-center justify-center h-full w-full">
        <icon-font class="text-2xl" :type="getFileIcon()" />
      </div>
    </template>
    <div
      v-if="!preview"
      class="absolute inset-0 flex items-center justify-center gap-3 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <a-space-compact >
        <a-button size="small" @click="onClickPreview" type="text" class="text-white!">
          <icon-font type="icon-view" />
        </a-button>
        <a-button size="small" v-if="enabledDelete" @click="onRemove" type="text" class="text-white!" >
          <icon-font type="icon-delete" />
        </a-button>
        <a-button size="small" v-if="enabledDownload" @click="onDownload" type="text" class="text-white!" >
          <icon-font type="icon-download" />
        </a-button>
      </a-space-compact>
    </div>
  </div>
</template>
