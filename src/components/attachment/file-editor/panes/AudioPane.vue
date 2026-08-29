<script setup lang="ts">
defineOptions({name: 'LFileAudioPane'})

defineProps<{
  src: string
}>()
</script>

<template>
  <div class="flex size-full items-center justify-center p-xs">
    <audio :src="src" controls class="w-full max-w-xl" />
  </div>
</template>
