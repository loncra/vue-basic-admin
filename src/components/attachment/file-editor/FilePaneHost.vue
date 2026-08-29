<script setup lang="ts">
import {computed} from 'vue'
import {AttachmentService} from '@/apis'
import type {ObjectItemInfo} from '@/types/apis'
import {
  buildFilePaneContext,
  resolveFilePaneKind,
} from '@/composables/attachment/filePaneKinds.ts'
import ImagePane from './panes/ImagePane.vue'
import VideoPane from './panes/VideoPane.vue'
import AudioPane from './panes/AudioPane.vue'
import UnsupportedPane from './panes/UnsupportedPane.vue'

defineOptions({
  name: 'LFilePaneHost',
})

const props = defineProps<{
  item: ObjectItemInfo
  bucket: string
}>()

const context = computed(() => buildFilePaneContext(props.item))
const kind = computed(() => resolveFilePaneKind(context.value))
const src = computed(() => AttachmentService.query(props.bucket, props.item.objectName))

const viewer = computed(() => {
  switch (kind.value.id) {
    case 'image':
      return ImagePane
    case 'video':
      return VideoPane
    case 'audio':
      return AudioPane
    default:
      return UnsupportedPane
  }
})
const paneProps = computed(() => {
  if (kind.value.id === 'image') {
    return {src: src.value, alt: context.value.name}
  }
  if (kind.value.id === 'video' || kind.value.id === 'audio') {
    return {src: src.value}
  }
  return {}
})
</script>

<template>
  <component
    :is="viewer"
    class="size-full"
    v-bind="paneProps"
  />
</template>
