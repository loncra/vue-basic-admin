<script setup lang="ts">
import type {ChatMessageContent} from '@/types/apis/message-server/chatDomain'
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";

defineProps<{
  content: ChatMessageContent
}>()
</script>

<template>
  <a-flex vertical gap="small" class="max-w-full">
    <template v-for="(block, index) in content.blocks" :key="index">
      <span
        v-if="block.type === 'text'"
        class="whitespace-pre-wrap break-words"
      >
        <template v-for="(segment, sIndex) in block.segments" :key="sIndex">
          <span v-if="segment.type === 'plain'">{{ segment.text }}</span>
          <span v-else-if="segment.type === 'mention'" class="text-primary">{{ `@${segment.label}` }}</span>
          <span v-else>{{ segment.label }}</span>
        </template>
      </span>

<!--      <l-attachment-upload preview v-else-if="['video', 'image'].includes(block.type)" v-model:value="block.file" />-->
      <l-attachment-upload preview v-else-if="block.type === 'files'" v-model:value="block.files" />

    </template>
  </a-flex>
</template>
