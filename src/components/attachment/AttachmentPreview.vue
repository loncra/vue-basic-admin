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
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";

defineOptions({
  name: 'LAttachmentPreview',
})

const props = withDefaults(defineProps<AttachmentPreviewProps>(),{
  mode: ATTACHMENT_PREVIEW_MODE.LIST,
  changeThumbUrl: true,
  showFilename: true,
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

const configProviderStore = useConfigProviderStore();

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

watch(() => fileList.value,()=> valueChange(),{ immediate: true, deep: true })

const classes = computed(() => ({
  ...props.classes,
  item: [props.classes?.item, (props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD ? 'h-[84px] w-[84px]' : 'h-[50px] w-[50px]' )].filter(Boolean).join(' '),
}))

</script>

<template>
  <span :class="props.classes?.container" :style="props.styles?.container">
    <a-flex
      vertical
      :class="['w-full', classes?.list]"
      gap="middle"
      :style="props.styles?.list"
      v-if="props.mode === ATTACHMENT_PREVIEW_MODE.LIST"
    >
      <slot name="listBefore" />
      <template :key="file.uid" v-for="file in fileList">
        <a-alert v-if="!slots.itemRender" :type="getAlertType(file.status)">
          <template #title>
            <a-flex justify="space-between" align="center" :gap="configProviderStore.getToken().sizeXS">
              <l-attachment-file-preview
                :show-progress="false"
                :item-class="classes?.item"
                :item-style="props.styles?.item"
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

                  <a-flex gap="small">
                    <a-button danger v-if="!preview" @click="onRemove(file)" type="text" :disabled="file.status === 'uploading'">
                      <icon-font type="loncra-archive-x" />
                    </a-button>
                    <a-button @click="onDownload(file.response as ObjectWriteResult)" type="text" v-if="file.response">
                      <icon-font type="loncra-download" />
                    </a-button>
                  </a-flex>
                </a-flex>

                <a-progress v-if="!file.response" :percent="file.percent" size="small" />
              </a-flex>
            </a-flex>
          </template>
        </a-alert>
        <slot v-else name="itemRender" :file="file" />
      </template>
    </a-flex>
    <span
      gap="small"
      :class="['flex flex-row gap-2 flex-wrap', classes?.list]"
      :style="props.styles?.list"
      v-else-if="props.mode === ATTACHMENT_PREVIEW_MODE.PICTURE_CARD"
    >
      <span
        :key="file.uid"
        v-for="file in fileList"
        :class="[
          'flex flex-inline flex-col p-xs border rounded-lg',
          preview ? 'border-border-secondary bg-container' : [
            file.status === undefined ? 'border-warning-border bg-warning-bg' : '',
            file.status === 'uploading' ? 'border-info-border bg-info-bg' : '',
            file.status === 'done' ? 'border-success-border bg-success-bg' : '',
            file.status === 'error' ? 'border-error-border bg-error-bg' : '',
          ]
        ]">
        <l-attachment-file-preview
          :enabled-delete="!preview"
          :border="!preview"
          :item-class="classes?.item"
          :item-style="props.styles?.item"
          @delete="(_file) => postRemove(_file)"
          @preview="openPreview"
          :file="file"
        >
          <template #itemRender="{file}" v-if="slots.itemRender">
            <slot name="itemRender" :file="file" />
          </template>
        </l-attachment-file-preview>
        <span :class="['flex flex-col gap-1',classes?.meta]" v-if="slots.itemTitle || slots.itemDescription">
          <a-typography-text strong v-if="slots.itemTitle" >
            <slot name="itemTitle" :file="file" />
          </a-typography-text>
          <a-typography-text v-else-if="showFilename" ellipsis>
            {{file.name}}
          </a-typography-text>
          <a-typography-text v-if="slots.itemDescription">
            <slot name="itemDescription" :file="file" />
          </a-typography-text>
        </span>
      </span>
      <slot name="pictureCardAfter" />
    </span>
  </span>

  <teleport to="body">
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
          loading="lazy"
        />

      </a-image-preview-group>
    </div>

    <a-modal
      :footer="null"
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
        class="size-full bg-layout max-h-100"
      >
        您的浏览器不支持视频播放。
      </video>
    </a-modal>
  </teleport>
</template>
