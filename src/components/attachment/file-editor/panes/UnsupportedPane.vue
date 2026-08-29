<script setup lang="ts">
defineOptions({
  name: 'LFileUnsupportedPane',
})

withDefaults(
  defineProps<{
    reason?: 'unsupported' | 'tooLarge'
  }>(),
  {
    reason: 'unsupported',
  },
)
</script>

<template>
  <a-flex class="size-full" align="center" justify="center">
    <a-empty :description="$t(`attachment.fileEditor.${reason}`)" />
  </a-flex>
</template>
