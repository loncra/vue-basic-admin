<script setup lang="ts">
defineOptions({name: 'LFileImagePane'})

defineProps<{
  src: string
  alt: string
}>()
</script>

<template>
  <div class="flex size-full items-center justify-center overflow-auto p-xs">
    <img :src="src" :alt="alt" class="max-h-full max-w-full object-contain" />
  </div>
</template>
