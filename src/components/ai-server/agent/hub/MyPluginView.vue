<script setup lang="ts">
import type {UserPluginInstallResult} from '@/types/apis'

defineOptions({
  name: 'LAgentHubMyPlugin',
})

defineProps<{
  installs?: UserPluginInstallResult[]
}>()
</script>

<template>
  <div class="size-full" />
</template>
