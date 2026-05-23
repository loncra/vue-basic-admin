<script setup lang="ts">

import {CROPPER_SELECTION_ID, useCropperInstance} from '@/composables/basic/useCropperInstance.ts'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import type {
  CropperModalCropPayload,
  CropperModalCroppedFile,
  CropperModalItem,
  CropperOutputResult,
  CropperOutputScale,
} from '@/types/composables/cropperModal.ts'
import {getImageBase64} from '@/utils/fileUtils.ts'
import {byteFormat} from '@/utils'
import {App} from 'antdv-next'
import {computed, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance} from 'vue'

defineOptions({
  name: 'LCropperModal',
})

const props = withDefaults(defineProps<{
  aspectRatio?: number
  compressQuality?: number
  outputMimeType?: string
  outputScales?: CropperOutputScale[]
  title?: string
  width?: string | number
}>(), {
  compressQuality: 0.5,
  outputMimeType: 'image/jpeg',
  title: '图片剪辑',
  width: 978,
})

const open = defineModel<boolean>('open', {default: false})
const items = defineModel<CropperModalItem[]>('items', {default: () => []})

const emit = defineEmits<{
  cancel: []
  crop: [payload: CropperModalCropPayload]
  complete: [items: CropperModalItem[]]
}>()

const {message} = App.useApp()
const configProviderStore = useConfigProviderStore()
const {
  cropperHostRef,
  cropperCanvasRef,
  cropperImageRef,
  cropperSelectionRef,
  ready,
  dragging,
  layoutInProgress,
  layout,
  onSelectionChange,
  applyAspectRatio,
  relativeZoom,
  move,
  rotate,
  reset,
  cropToOutputs,
  setAfterInteraction,
  isSelectionReady,
  resolveCropperElements,
} = useCropperInstance()

const selectedItem = computed(() => items.value.find((item) => item.selected))
const previewLoading = computed(() => items.value.some((item) => item.preview === undefined))
const hasFixedAspectRatio = computed(() => props.aspectRatio != null && props.aspectRatio > 0)
const previewAspectStyle = computed(() => {
  const ratio = props.aspectRatio ?? 4 / 3
  return {
    width: '100%',
    aspectRatio: `${ratio}`,
  } as const
})
const resolvedOutputScales = computed((): CropperOutputScale[] => {
  if (props.outputScales?.length) {
    return props.outputScales
  }
  return [{scale: 1}]
})

const croppedPreviewScale = ref(1)
const previewRefreshing = ref(false)
const liveCompressedPreview = ref<CropperOutputResult | null>(null)
const confirming = ref(false)
let previewRefreshTimer: ReturnType<typeof setTimeout> | null = null
let previewRefreshInFlight = false
let layoutTask: Promise<void> | null = null
let onCanvasActionEnd: ((event: Event) => void) | null = null

const hasCompressPreview = computed(() => props.compressQuality != null && props.compressQuality > 0)

const selectedCroppedOutput = computed(() => {
  if (liveCompressedPreview.value) {
    return liveCompressedPreview.value
  }
  const item = selectedItem.value
  if (!item) {
    return null
  }
  if (item.outputs?.length) {
    return item.outputs.find((output) => output.scale === croppedPreviewScale.value) ?? item.outputs[0]!
  }
  if (item.cropImg && item.blob) {
    return {
      scale: 1,
      width: 0,
      height: 0,
      blob: item.blob,
      dataUrl: item.cropImg,
    }
  }
  return null
})

const croppedPreviewScaleOptions = computed(() => {
  const outputs = selectedItem.value?.outputs
  if (!outputs || outputs.length <= 1) {
    return []
  }
  return outputs.map((output) => ({
    label: output.suffix ? `${output.scale}x (${output.suffix})` : `${output.scale}x`,
    value: output.scale,
  }))
})

watch(croppedPreviewScale, (scale) => {
  const outputs = selectedItem.value?.outputs
  if (!outputs?.length) {
    return
  }
  const matched = outputs.find((output) => output.scale === scale)
  if (matched) {
    liveCompressedPreview.value = matched
  }
})

watch(
  () => selectedItem.value?.uid,
  (uid, prevUid) => {
    if (!uid || !prevUid || uid === prevUid) {
      return
    }
    liveCompressedPreview.value = null
    croppedPreviewScale.value = selectedItem.value?.outputs?.[0]?.scale ?? 1
    void layoutSelectedCropper()
  },
)

function applyCropResult(
  uid: string,
  outputs: CropperOutputResult[],
  previewOutput: CropperOutputResult,
) {
  items.value = items.value.map((item) => (
    item.uid === uid
      ? {
          ...item,
          outputs,
          cropImg: previewOutput.dataUrl,
          blob: previewOutput.blob,
        }
      : item
  ))
}

function unbindPreviewListeners() {
  unbindCanvasActionEndListener()
  setAfterInteraction(null)
}

function unbindCanvasActionEndListener() {
  const canvas = cropperCanvasRef.value
  if (canvas && onCanvasActionEnd) {
    canvas.removeEventListener('actionend', onCanvasActionEnd)
  }
  onCanvasActionEnd = null
}

function bindCanvasActionEndListener() {
  unbindCanvasActionEndListener()
  const canvas = resolveCropperElements()?.canvas ?? cropperCanvasRef.value
  if (!canvas) {
    return
  }
  onCanvasActionEnd = () => {
    if (!dragging.value && !previewRefreshInFlight) {
      scheduleCroppedPreviewRefresh()
    }
  }
  canvas.addEventListener('actionend', onCanvasActionEnd)
}

function bindPreviewListeners() {
  bindCanvasActionEndListener()
  setAfterInteraction(() => {
    if (!previewRefreshInFlight) {
      scheduleCroppedPreviewRefresh()
    }
  })
}

function scheduleCroppedPreviewRefresh() {
  if (!hasCompressPreview.value || !open.value || dragging.value || previewRefreshInFlight) {
    return
  }
  if (previewRefreshTimer) {
    clearTimeout(previewRefreshTimer)
  }
  previewRefreshTimer = setTimeout(() => {
    previewRefreshTimer = null
    void refreshCroppedPreview()
  }, 300)
}

async function refreshCroppedPreview(retry = 0) {
  if (!hasCompressPreview.value || !open.value || confirming.value || previewRefreshInFlight) {
    return
  }
  if (layoutInProgress.value || dragging.value || !ready.value) {
    if (retry < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      await refreshCroppedPreview(retry + 1)
    }
    return
  }

  const current = selectedItem.value
  const selection = resolveCropperElements()?.selection ?? cropperSelectionRef.value
  if (!current || !selection || !isSelectionReady(selection)) {
    if (retry < 10) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await refreshCroppedPreview(retry + 1)
    }
    return
  }

  previewRefreshInFlight = true
  previewRefreshing.value = true
  try {
    await cropPreviewItem(current)
  } finally {
    previewRefreshing.value = false
    previewRefreshInFlight = false
  }
}

async function cropPreviewItem(item = selectedItem.value): Promise<boolean> {
  if (!item) {
    return false
  }
  const selection = resolveCropperElements()?.selection ?? cropperSelectionRef.value
  if (!selection || !isSelectionReady(selection)) {
    return false
  }

  const outputs = await cropToOutputs([{scale: 1}], {
    mimeType: props.outputMimeType,
    quality: props.compressQuality,
  })
  const previewOutput = outputs[0]
  if (!previewOutput) {
    return false
  }

  liveCompressedPreview.value = previewOutput
  return true
}

async function cropFinalItem(item = selectedItem.value): Promise<boolean> {
  if (!item) {
    return false
  }
  const selection = resolveCropperElements()?.selection ?? cropperSelectionRef.value
  if (!selection || !isSelectionReady(selection)) {
    return false
  }

  const outputs = await cropToOutputs(resolvedOutputScales.value, {
    mimeType: props.outputMimeType,
    quality: props.compressQuality,
  })
  if (outputs.length === 0) {
    return false
  }

  const previewOutput = outputs.find((output) => output.scale === 1) ?? outputs[0]!
  applyCropResult(item.uid, outputs, previewOutput)
  return true
}

function onSelectionChangeWithPreview(event: Event) {
  if (layoutInProgress.value || previewRefreshInFlight) {
    return
  }
  onSelectionChange(event)
}

function onZoom(ratio: number) {
  relativeZoom(ratio)
  scheduleCroppedPreviewRefresh()
}

function onRotate(degree: number | string) {
  rotate(degree)
  scheduleCroppedPreviewRefresh()
}

async function onReset() {
  reset(hasFixedAspectRatio.value ? props.aspectRatio : undefined)
  await nextTick()
  scheduleCroppedPreviewRefresh()
}

async function layoutSelectedCropper() {
  if (!open.value || !selectedItem.value?.preview) {
    return
  }
  if (layoutTask) {
    return layoutTask
  }
  layoutTask = (async () => {
    liveCompressedPreview.value = null
    await layout(hasFixedAspectRatio.value ? props.aspectRatio : undefined)
    bindPreviewListeners()
    await nextTick()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    await refreshCroppedPreview()
  })().finally(() => {
    layoutTask = null
  })
  return layoutTask
}

function onCropperHostMounted(el: Element | ComponentPublicInstance | null) {
  cropperHostRef.value = (el instanceof Element ? el : undefined) as HTMLElement | undefined
  if (el instanceof Element && open.value && selectedItem.value?.preview) {
    void layoutSelectedCropper()
  }
}

function onAfterOpenChange(visible: boolean) {
  if (visible) {
    void nextTick().then(() => layoutSelectedCropper())
  } else {
    ready.value = false
    liveCompressedPreview.value = null
    unbindPreviewListeners()
    if (previewRefreshTimer) {
      clearTimeout(previewRefreshTimer)
      previewRefreshTimer = null
    }
  }
}

watch(
  () => props.aspectRatio,
  (ratio) => {
    if (ratio != null && ratio > 0) {
      applyAspectRatio(ratio)
    }
  },
)

function selectCropper(image: CropperModalItem) {
  items.value.forEach((item) => {
    item.selected = item.uid === image.uid
  })
}

async function openWithFiles(files: File[], uids?: string[]) {
  const imageFiles = files.filter((file) => file.type.includes('image/'))
  if (imageFiles.length === 0) {
    return
  }

  const nextItems: CropperModalItem[] = imageFiles.map((file, index) => ({
    uid: uids?.[index] ?? `${Date.now()}-${index}-${file.name}`,
    name: file.name,
    type: file.type,
    selected: index === 0,
    cutting: false,
    originFileObj: file,
  }))
  for (const item of nextItems) {
    item.preview = await getImageBase64(item.originFileObj)
  }

  items.value = nextItems
  open.value = true
}

function buildOutputFileName(name: string, suffix?: string): string {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex <= 0) {
    return `${name}${suffix ?? ''}`
  }
  const base = name.slice(0, dotIndex)
  const ext = name.slice(dotIndex)
  return `${base}${suffix ?? ''}${ext}`
}

function isItemCropped(item: CropperModalItem): boolean {
  return !!(item.outputs?.length || item.blob)
}

function getCroppedFiles(): CropperModalCroppedFile[] {
  const files: CropperModalCroppedFile[] = []
  for (const item of items.value) {
    if (item.outputs?.length) {
      for (const output of item.outputs) {
        files.push({
          uid: `${item.uid}-${output.scale}`,
          scale: output.scale,
          file: new File(
            [output.blob],
            buildOutputFileName(item.name, output.suffix),
            {type: item.type || props.outputMimeType},
          ),
        })
      }
      continue
    }
    if (item.blob) {
      files.push({
        uid: item.uid,
        scale: 1,
        file: new File([item.blob], item.name, {type: item.type || props.outputMimeType}),
      })
    }
  }
  return files
}

function emitCompleteIfNeeded() {
  if (items.value.length > 0 && items.value.every(isItemCropped)) {
    emit('complete', items.value)
  }
}

async function onConfirm() {
  if (confirming.value) {
    return
  }
  confirming.value = true
  try {
    const snapshot = [...items.value]
    for (const item of snapshot) {
      selectCropper(item)
      await nextTick()
      await layout(hasFixedAspectRatio.value ? props.aspectRatio : undefined)
      if (!await cropFinalItem(item)) {
        message.error(`裁剪失败：${item.name}`)
        return
      }
    }
    emitCompleteIfNeeded()
    open.value = false
  } finally {
    confirming.value = false
  }
}

function onCancel() {
  open.value = false
  ready.value = false
  unbindPreviewListeners()
  emit('cancel')
}

defineExpose({
  open: openWithFiles,
  getCroppedFiles,
})

onBeforeUnmount(() => {
  unbindPreviewListeners()
  if (previewRefreshTimer) {
    clearTimeout(previewRefreshTimer)
    previewRefreshTimer = null
  }
})

</script>

<template>
  <a-modal
    v-model:open="open"
    class="dactiv"
    :width="width"
    :title="title"
    :confirm-loading="confirming"
    @ok="onConfirm"
    @cancel="onCancel"
    @after-open-change="onAfterOpenChange"
  >
    <a-skeleton :loading="previewLoading">
      <a-row :gutter="[configProviderStore.getToken().marginLG, configProviderStore.getToken().marginLG]">
        <a-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16" :xxl="16">
          <template v-if="selectedItem?.preview">
            <a-spin :spinning="confirming" description="处理中...">
              <div :ref="onCropperHostMounted" class="cropper-host">
              <cropper-canvas
                ref="cropperCanvasRef"
                class="cropper-canvas"
                background
              >
                <cropper-image
                  :key="selectedItem.uid"
                  ref="cropperImageRef"
                  :src="selectedItem.preview"
                  alt="Picture"
                  initial-center-size="contain"
                  rotatable
                  scalable
                  skewable
                  translatable
                />
                <cropper-shade hidden />
                <cropper-handle v-if="!hasFixedAspectRatio" action="select" plain />
                <cropper-selection
                  :id="CROPPER_SELECTION_ID"
                  ref="cropperSelectionRef"
                  :aspect-ratio="hasFixedAspectRatio ? aspectRatio : undefined"
                  :initial-aspect-ratio="hasFixedAspectRatio ? aspectRatio : undefined"
                  initial-coverage="0.5"
                  movable
                  :resizable="!hasFixedAspectRatio"
                  @change="onSelectionChangeWithPreview"
                >
                  <cropper-grid role="grid" covered />
                  <cropper-crosshair centered />
                  <cropper-handle action="move" plain />
                  <template v-if="!hasFixedAspectRatio">
                    <cropper-handle action="n-resize" />
                    <cropper-handle action="e-resize" />
                    <cropper-handle action="s-resize" />
                    <cropper-handle action="w-resize" />
                    <cropper-handle action="ne-resize" />
                    <cropper-handle action="nw-resize" />
                    <cropper-handle action="se-resize" />
                    <cropper-handle action="sw-resize" />
                  </template>
                </cropper-selection>
              </cropper-canvas>
              </div>
              <a-space-compact block class="mt-lg flex justify-center items-center">
                <a-tooltip title="放大">
                  <a-button @click="onZoom(0.2)">
                    <icon-font type="icon-zoom-in" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="缩小">
                  <a-button @click="onZoom(-0.2)">
                    <icon-font type="icon-zoom-out" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="左移">
                  <a-button @click="move(-10, 0)">
                    <icon-font type="icon-left-arrow" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="右移">
                  <a-button @click="move(10, 0)">
                    <icon-font type="icon-right-arrow" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="上移">
                  <a-button @click="move(0, -10)">
                    <icon-font type="icon-up-arrow" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="下移">
                  <a-button @click="move(0, 10)">
                    <icon-font type="icon-down-arrow" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="逆时针旋转">
                  <a-button @click="onRotate('-90deg')">
                    <icon-font type="icon-return" class="rotate-180" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="顺时针旋转">
                  <a-button @click="onRotate('90deg')">
                    <icon-font type="icon-return" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="重置">
                  <a-button @click="onReset()">
                    <icon-font type="icon-delete" />
                  </a-button>
                </a-tooltip>
              </a-space-compact>
            </a-spin>
          </template>
        </a-col>

        <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" :xxl="8">
          <a-divider orientation="left" plain class="!mt-0 mb-lg">
            <a-space>
              <icon-font class="icon" type="icon-eye-open" />
              <span class="hidden md:inline">预览</span>
            </a-space>
          </a-divider>
          <cropper-viewer
            :selection="`#${CROPPER_SELECTION_ID}`"
            resize="vertical"
            class="cropper-preview border border-solid border-border-secondary rounded-lg overflow-hidden"
          />

          <template v-if="hasCompressPreview">
            <a-divider orientation="left" plain>
              <a-space>
                <icon-font class="icon" type="icon-charging-management" />
                <span class="hidden md:inline">压缩后</span>
              </a-space>
            </a-divider>
            <a-spin :spinning="previewRefreshing" description="生成预览...">
              <div class="cropped-image">
                <template v-if="selectedCroppedOutput">
                  <a-image
                    :src="selectedCroppedOutput.dataUrl"
                    class="border border-solid border-border-secondary rounded-lg w-full object-contain bg-fill-secondary"
                    :style="previewAspectStyle"
                    alt="压缩后的内容"
                  />
                  <div
                    v-if="selectedCroppedOutput.width > 0 && selectedCroppedOutput.height > 0"
                    class="mt-sm text-secondary text-xs text-center"
                  >
                    {{ selectedCroppedOutput.width }} × {{ selectedCroppedOutput.height }}
                    · {{ byteFormat(selectedCroppedOutput.blob.size) }}
                  </div>
                  <a-segmented
                    v-if="croppedPreviewScaleOptions.length > 0"
                    v-model:value="croppedPreviewScale"
                    block
                    size="small"
                    class="mt-sm"
                    :options="croppedPreviewScaleOptions"
                  />
                </template>
                <div
                  v-else
                  class="crop-placeholder bg-fill-secondary rounded-lg flex items-center justify-center text-secondary text-sm"
                  :style="previewAspectStyle"
                >
                  调整选区后自动生成
                </div>
              </div>
            </a-spin>
          </template>
        </a-col>
      </a-row>

      <template v-if="items.length > 1">
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="icon-carousel" />
            <span class="hidden md:inline">图片组</span>
          </a-space>
        </a-divider>
        <a-space
          :size="[configProviderStore.getToken().margin, configProviderStore.getToken().margin]"
          wrap
          class="flex justify-center items-center w-full"
        >
          <a-card
            v-for="img of items"
            :key="img.uid"
            hoverable
            :body-style="{padding: 0}"
            @click="selectCropper(img)"
          >
            <a-badge-ribbon :color="img.cropImg ? 'green' : 'blue'" :text="img.cropImg ? '已调整' : '待调整'">
              <a-image
                class="rounded-lg"
                :preview="false"
                :width="98"
                :height="98"
                :src="img.preview"
              />
            </a-badge-ribbon>
          </a-card>
        </a-space>
      </template>
    </a-skeleton>
  </a-modal>
</template>

<style scoped>
.cropper-host {
  display: block;
  width: 100%;
}

.cropper-canvas {
  display: block;
  width: 100%;
  height: 372px;
}

:deep(cropper-selection) {
  cursor: move;
}

:deep(cropper-image) {
  cursor: grab;
}

:deep(cropper-image:active) {
  cursor: grabbing;
}

.cropper-preview {
  display: block;
  width: 100%;
}

.crop-placeholder {
  min-height: 120px;
}

:deep(.cropped-image .ant-image) {
  display: block;
  width: 100%;
}
</style>
