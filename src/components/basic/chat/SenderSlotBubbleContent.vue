<script setup lang="ts">
import type {ChatContentBlock} from '@/types/composables'

defineOptions({
  name: 'LSenderSoldBubbleContent',
})

defineProps<{
  content: ChatContentBlock[]
}>()

</script>

<template>

  <template v-for="(block, index) in content" :key="index">
    <span
      v-if="block.type === 'text'"
      class="whitespace-pre-wrap wrap-break-word"
    >{{ block.value }}
    </span>

    <a-tag variant="outlined" v-else-if="block.type === 'custom' && block.slotKind === 'instruction'">
      <template #icon v-if="block.prefix === '@'">
        <icon-font type="loncra-at-sign" />
      </template>
      {{ block.value.value }}
    </a-tag>

    <slot v-else name="renderBlock" :block="block" :index="index" />

  </template>
</template>
