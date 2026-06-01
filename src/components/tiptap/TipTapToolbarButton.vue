<script setup lang="ts">
import type {TipTapToolbarSize} from '@/types/composables/tiptap'
import type {VNode} from "vue";

defineOptions({
  name: 'LTipTapToolbarButton',
})

withDefaults(
  defineProps<{
    icon?: string | VNode
    tooltip?: string
    active?: boolean
    disabled?: boolean
    size?: TipTapToolbarSize
  }>(),
  {
    size: 'small',
    active: false,
    disabled: false,
    icon: '',
  },
)

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <a-tooltip :title="tooltip || icon">
    <a-button
      :size="size"
      :type="active ? 'primary' : 'text'"
      :disabled="disabled"
      @click="(event: MouseEvent) => $emit('click', event)"
    >
      <icon-font :type="icon" />
    </a-button>
  </a-tooltip>
</template>
