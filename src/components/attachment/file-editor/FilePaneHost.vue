<script setup lang="ts">
import {computed, watch} from 'vue'
import type {ObjectItemInfo} from '@/types/apis'
import {useFilePane} from '@/composables/attachment/useFilePane.ts'
import ImagePane from './panes/ImagePane.vue'
import VideoPane from './panes/VideoPane.vue'
import AudioPane from './panes/AudioPane.vue'
import TextPane from './panes/TextPane.vue'
import UnsupportedPane from './panes/UnsupportedPane.vue'

defineOptions({
  name: 'LFilePaneHost',
})

const props = defineProps<{
  item: ObjectItemInfo
  bucket: string
  readonly: boolean
  rootPath: string
}>()

const emit = defineEmits<{
  dirtyChange: [dirty: boolean]
}>()

const pane = useFilePane(props)

const viewer = computed(() => {
  if (pane.paneReason.value) {
    return UnsupportedPane
  }
  switch (pane.kind.value.id) {
    case 'image':
      return ImagePane
    case 'video':
      return VideoPane
    case 'audio':
      return AudioPane
    case 'text':
      return TextPane
    default:
      return UnsupportedPane
  }
})

const paneProps = computed(() => {
  if (pane.paneReason.value) {
    return {reason: pane.paneReason.value}
  }
  switch (pane.kind.value.id) {
    case 'image':
      return {src: pane.src.value, alt: pane.context.value.name}
    case 'video':
    case 'audio':
      return {src: pane.src.value}
    case 'text':
      return {
        ext: pane.context.value.ext,
        readonly: props.readonly,
        modelValue: pane.content.value,
        'onUpdate:modelValue': pane.updateContent,
      }
    default:
      return {reason: 'unsupported' as const}
  }
})

const showViewer = computed(
  () => pane.kind.value.id !== 'text' || !pane.loading.value || !!pane.paneReason.value,
)

watch(
  pane.dirty,
  (value) => emit('dirtyChange', value),
  {immediate: true},
)

defineExpose({
  dirty: pane.dirty,
  save: pane.save,
  kind: pane.kind,
})
</script>

<template>
  <a-spin
    :spinning="pane.loading.value"
    class="size-full-spin size-full min-h-0"
  >
    <div class="size-full min-h-0">
      <component
        v-if="showViewer"
        :is="viewer"
        class="size-full min-h-0"
        v-bind="paneProps"
      />
    </div>
  </a-spin>
</template>
