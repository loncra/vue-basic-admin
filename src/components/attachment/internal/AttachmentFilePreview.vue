<script setup lang="ts">

import type {UploadFile} from "antdv-next/dist/upload/interface";

defineOptions({
  name: 'LAttachmentFilePreview',
})

const props = withDefaults(defineProps<{
  file: UploadFile
  preview?:boolean
  height?:string
  width?:string
  enabledDelete?:boolean
}>(),{
  preview:false,
  height:'100%',
  width:'100%',
  enabledDelete: true
})

const emit = defineEmits<{
  (e:'delete', file: UploadFile): void
  (e:'preview', file: UploadFile): void
}>()

function onDelete() {
  emit('delete', props.file)
}

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

</script>

<template>

  <div
    class="group relative size-16 shrink-0 overflow-hidden rounded border border-border-secondary"
    :style="{width:props.width, height: props.height}"
  >
      <img
        v-if="file.thumbUrl"
        class="size-full object-cover"
        :alt="file.name"
        :src="file.thumbUrl"
      />
      <div v-else class="flex items-center justify-center h-full w-full">
        <icon-font class="text-2xl" :type="getFileIcon()" />
      </div>
      <div
        v-if="!preview"
        class="absolute inset-0 flex items-center justify-center gap-3 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <a-space-compact >
          <a-button size="small" @click="onClickPreview" type="text" class="text-white!">
            <icon-font type="icon-view" />
          </a-button>
          <a-button size="small" v-if="enabledDelete" @click="onDelete" type="text" class="text-white!" >
            <icon-font type="icon-delete" />
          </a-button>
        </a-space-compact>
      </div>
  </div>
</template>
