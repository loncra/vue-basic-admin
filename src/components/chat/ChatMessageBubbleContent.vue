<script setup lang="ts">
import type {ChatContentBlock} from '@/types/composables'
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import type {UserChatMessageResponseBody} from "@/types/apis";

defineOptions({
  name: 'LChatMessageBubbleContent',
})

defineProps<{
  content: ChatContentBlock[]
}>()

const emit = defineEmits<{
  jumpToReference: [message: UserChatMessageResponseBody]
}>()

</script>

<template>
  <div class="max-w-full">
    <template v-for="(block, index) in content" :key="index">
      <!-- 官方：text 词槽 = 行内片段；value 内 \n = 软换行 -->
      <span
        v-if="block.type === 'text'"
        class="whitespace-pre-wrap break-words"
      >{{ block.value }}</span>
      <!-- 官方：custom = 块级结构 -->
      <div
        v-else-if="block.type === 'custom' && block.slotKind === 'files'"
        class="block w-full mt-1"
      >
        <l-attachment-upload preview v-model:value="block.files" />
      </div>
      <!-- reference / undo 同理用 block 容器 -->
    </template>
  </div>
</template>
