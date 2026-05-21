<script setup lang="ts">

import {byteFormat, getImageBase64, getVideoThumbnail} from "@/utils";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {computed, ref, watch} from "vue";
import type {VideoThumbnailResult} from "@/types/composables";
import type {AttachmentPreviewMode} from "@/types/composables/attachmentUpload.ts";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants/systemConstant.ts";
import LAttachmentFilePreview from "@/components/attachment/internal/AttachmentFilePreview.vue";

defineOptions({
  name: 'LAttachmentPreview',
})

const props = withDefaults(defineProps<{
  mode?: AttachmentPreviewMode
  preview?:boolean,
}>(),{
  mode: ATTACHMENT_PREVIEW_MODE.LIST,
  preview:false,
})

const previewImageGroup = ref({
  open: false,
  current: 0,
})

const fileList = defineModel<UploadFile[]>('fileList', {default:() => []})

const modalOptions = ref<{
  open: boolean
  file?: UploadFile
}>({
  open:false
})

function getAlertType(status:string | undefined) {
  if (status === undefined) {
    return 'warning'
  }
  if (status === 'error') {
    return 'error'
  } else if (status === 'done') {
    return 'success'
  } else if (status === 'uploading') {
    return 'info'
  } else {
    return 'warning'
  }
}

function onRemove(file: UploadFile) {
  fileList.value = fileList.value.filter(item => item.uid !== file.uid)
}

const imageFiles = computed(() =>
  fileList.value.filter(f => f.type?.includes('image/') && (f.thumbUrl || f.url) )
)

function openPreview(file: UploadFile) {
  if (file.type?.includes('image/')) {
    const index = imageFiles.value.findIndex(f => f.uid === file.uid)
    if (index === -1) {
      return
    }
    previewImageGroup.value.current = index
    previewImageGroup.value.open = true
  } else if (file.type?.includes('video/')) {
    modalOptions.value = {open: true, file}
  }
}

async function ensureThumbUrl(file: UploadFile) {
  if (file.thumbUrl) {
    return
  }
  if (file.url && file.type?.includes('image/')) {
    fileList.value = fileList.value.map(f =>
      f.uid === file.uid ? {...f, thumbUrl: file.url} : f
    )
    return
  }
  if (!file.originFileObj) {
    return
  }

  if (file.type?.includes("image/")) {
    const thumbUrl = await getImageBase64(file.originFileObj)
    fileList.value = fileList.value.map(f =>
      f.uid === file.uid ? { ...f, thumbUrl } : f
    )
  } else if (file?.type?.includes("video/") && file.originFileObj) {
    const result:VideoThumbnailResult = await getVideoThumbnail(file.originFileObj);
    fileList.value = fileList.value.map(f =>
      f.uid === file.uid ? { ...f, thumbUrl:result.base64,url: result.videoUrl } : f
    )
  }
}

watch(() => fileList.value,()=> fileList.value.forEach(f => ensureThumbUrl(f)))

</script>

<template>
  <div>
    <div class="hidden">
      <a-image-preview-group
        :preview="{
          open: previewImageGroup.open,
          current: previewImageGroup.current,
          onOpenChange: (open:boolean) => (previewImageGroup.open = open),
          onChange: (cur:number) => (previewImageGroup.current = cur),
        }"
      >
        <a-image
          v-for="file in imageFiles"
          :key="file.uid"
          :src="file.thumbUrl || file.url"
          :alt="file.name"
        />
      </a-image-preview-group>
    </div>

    <a-modal destroy-on-hidden v-model:open="modalOptions.open" :title="modalOptions.file?.name" @ok="modalOptions.open = false" @cancel="modalOptions.open = false">
      <video
        v-if="modalOptions?.file?.type?.includes('video/')"
        :src="modalOptions?.file.url"
        controls
        autoplay
        style="width: 100%; height: 400px"
      >
        您的浏览器不支持视频播放。
      </video>
    </a-modal>

    <a-space direction="vertical" v-if="props.mode === ATTACHMENT_PREVIEW_MODE.LIST">
      <a-alert :key="file.uid" v-for="file in fileList" :type="getAlertType(file.status)">
        <template #title>
          <a-flex justify="space-between" align="flex-end" :gap="8">
            <l-attachment-file-preview :preview="preview" height="50px" width="50px" @preview="openPreview" :file="file" :enabled-delete="false" />

            <a-flex vertical flex="1" class="min-w-0">
              <a-flex align="center" class="min-w-0 overflow-hidden">
                <a-typography-text ellipsis class="min-w-0">
                  {{ file.name }}
                </a-typography-text>
                <a-typography-text type="secondary" class="hidden md:inline shrink-0 ml-1">
                  ({{ byteFormat(file.size || 0) }})
                </a-typography-text>
              </a-flex>
              <a-progress :percent="file.percent" size="small" />
            </a-flex>
            <a-space-compact>
              <a-button @click="onRemove(file)" type="text" :disabled="file.status === 'uploading'">
                <icon-font type="icon-delete" />
              </a-button>
              <a-button @click="onRemove(file)" type="text" v-if="file.url">
                <icon-font type="icon-download" />
              </a-button>
            </a-space-compact>
          </a-flex>
        </template>
      </a-alert>
    </a-space>
    <a-space wrap v-else-if="props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD">
      <a-card :classes="{body:'p-xs'}" size="small" :key="file.uid" v-for="file in fileList" :type="getAlertType(file.status)">
        <l-attachment-file-preview :preview="preview" width="84px" height="84px" @delete="onRemove" @preview="openPreview" :file="file" />
      </a-card>
      <slot name="pictureCardAfter" />
    </a-space>
  </div>
</template>
