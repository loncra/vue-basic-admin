<script setup lang="ts">
defineOptions({name: 'LFileVideoPane'})

defineProps<{
  src: string
}>()
</script>

<template>
  <div class="flex size-full items-center justify-center overflow-auto p-xs">
    <video :src="src" controls class="max-h-full max-w-full bg-layout" />
  </div>
</template>
