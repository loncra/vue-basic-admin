<script setup lang="ts">
import type {ChatContentBlock} from '@/types/composables'
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";

defineProps<{
  content: ChatContentBlock[]
}>()
</script>

<template>
  <a-flex vertical gap="small" class="max-w-full">
    <template v-for="(block, index) in content" :key="index">
      <span v-if="block.type === 'text'">
        {{block.value}}
      </span>

      <l-attachment-upload preview v-else-if="block.type === 'custom' && block.slotKind === 'files'" v-model:value="block.files" />

    </template>
  </a-flex>
</template>
