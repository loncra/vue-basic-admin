<script setup lang="ts">

import {byteFormat, getImageBase64, getVideoThumbnail, requireNonNullOrUndefined} from "@/utils";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  ref,
  useSlots,
  watch
} from "vue";
import type {VideoThumbnailResult} from "@/types/composables";
import type {AttachmentPreviewProps} from "@/types/composables/attachmentUpload.ts";
import {ATTACHMENT_PREVIEW_MODE} from "@/constants/systemConstant.ts";
import LAttachmentFilePreview from "@/components/attachment/internal/AttachmentFilePreview.vue";
import type {ObjectWriteResult, RestResult} from "@/types/apis";
import {AttachmentService} from "@/apis";
import useApp from "antdv-next/dist/app/useApp";
import LBasicImage from "@/components/basic/BasicImage.vue";

defineOptions({
  name: 'LAttachmentPreview',
})

const props = withDefaults(defineProps<AttachmentPreviewProps>(),{
  mode: ATTACHMENT_PREVIEW_MODE.LIST,
  changeThumbUrl: true,
  preview:false,
})

const previewImageGroup = ref({
  open: false,
  current: 0,
})

const slots = useSlots()
const {message, modal} = useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const fileList = defineModel<UploadFile<ObjectWriteResult>[]>('fileList', {default:() => []})

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

const imageFiles = computed(() =>
  fileList.value.filter(f => f.type?.includes('image/') && (f.thumbUrl || f.url) )
)

function postRemove(file:UploadFile<ObjectWriteResult>) {
  fileList.value = fileList.value.filter(f => f.uid !== file.uid)
}

function onDownload(file: ObjectWriteResult) {
  AttachmentService.download(file.bucketName, file.objectName);
}

function onRemove(file:UploadFile<ObjectWriteResult>) {
  if (file.response) {
    modal.confirm({
      title: globalProperties.$t('common.delete.confirmTitle'),
      content: globalProperties.$t('common.delete.confirmSingle'),
      onOk: () => doRemove(file)
    })
  } else {
    postRemove(file)
  }
}

async function doRemove(file: UploadFile<ObjectWriteResult>) {
  if (!file.response) {
    return ;
  }
  try {
    const result:RestResult<void> = await AttachmentService.removeAttachment([file.response])
    message.success(result.message)
    postRemove(file)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}


function openPreview(file: UploadFile<ObjectWriteResult>) {
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

async function ensureThumbUrl(file: UploadFile<ObjectWriteResult>) {
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

function valueChange() {
  if (!props.changeThumbUrl){
    return
  }
  fileList.value.forEach(f => ensureThumbUrl(f))
}

watch(() => fileList.value,()=> valueChange())

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
        <l-basic-image
          v-for="file in imageFiles"
          :key="file.uid"
          :src="file.thumbUrl || file.url"
          :alt="file.name"
        />

      </a-image-preview-group>
    </div>

    <a-modal
      destroy-on-hidden
      v-model:open="modalOptions.open"
      :title="modalOptions.file?.name"
      @ok="modalOptions.open = false"
      @cancel="modalOptions.open = false"
    >
      <video
        v-if="modalOptions?.file?.type?.includes('video/')"
        :src="modalOptions?.file.url"
        controls
        autoplay
        class="size-full bg-layout max-h-160 max-w-160"
      >
        您的浏览器不支持视频播放。
      </video>
    </a-modal>

    <slot name="listBefore" />
    <a-space direction="vertical" class="w-full"  v-if="props.mode === ATTACHMENT_PREVIEW_MODE.LIST">
      <template :key="file.uid" v-for="file in fileList">
        <a-alert v-if="!slots.itemRender" :type="getAlertType(file.status)">
          <template #title>
            <a-flex justify="space-between" align="center" :gap="8">
              <l-attachment-file-preview
                :preview="preview"
                :height="props?.height || '50px'"
                :width="props?.width || '50px'"
                @preview="openPreview"
                :file="file"
                :enabled-download="false"
                :enabled-delete="false"
              />
              <a-flex vertical flex="1" class="min-w-0">
                <a-flex flex="1" class="min-w-0">
                  <a-flex vertical flex="1" class="min-w-0">
                    <a-typography-text ellipsis class="min-w-0">
                      {{ file.name }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="hidden md:inline shrink-0 ml-1">
                      ({{ byteFormat(file.size || 0) }})
                    </a-typography-text>
                  </a-flex>

                  <a-space>
                    <a-button danger v-if="!preview" @click="onRemove(file)" type="text" :disabled="file.status === 'uploading'">
                      <icon-font type="icon-delete" />
                    </a-button>
                    <a-button @click="onDownload(file.response as ObjectWriteResult)" type="text" v-if="file.response">
                      <icon-font type="icon-download" />
                    </a-button>
                  </a-space>
                </a-flex>

                <a-progress v-if="!file.response" :percent="file.percent" size="small" />
              </a-flex>
            </a-flex>
          </template>
        </a-alert>
        <slot v-else name="itemRender" :file="file" />
      </template>
    </a-space>
    <a-space wrap v-else-if="props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD">
      <a-card :classes="{body:'p-xs'}" size="small" :key="file.uid" v-for="file in fileList" :type="getAlertType(file.status)">
        <l-attachment-file-preview :preview="preview" :width="props?.width || '84px'" :height="props?.height || '84px'" @delete="(_file) => postRemove(_file)" @preview="openPreview" :file="file">
          <template #itemRender="{file}" v-if="slots.itemRender">
            <slot name="itemRender" v-if="slots.itemRender" :file="file" />
          </template>
        </l-attachment-file-preview>
      </a-card>
      <slot name="pictureCardAfter" />
    </a-space>
  </div>
</template>
