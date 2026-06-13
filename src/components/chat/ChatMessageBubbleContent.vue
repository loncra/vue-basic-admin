<script setup lang="ts">
import type {ChatContentBlock} from '@/types/composables'
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import LChatMessageReference from "@/components/chat/MessageReference.vue";
import type {UserChatMessageResponseBody} from "@/types/apis";

defineProps<{
  content: ChatContentBlock[]
}>()

const emit = defineEmits<{
  jumpToReference: [message: UserChatMessageResponseBody]
}>()

</script>

<template>
  <a-flex vertical gap="small" class="max-w-full">
    <template v-for="(block, index) in content" :key="index">
      <span v-if="block.type === 'text'">
        {{block.value}}
      </span>

      <l-attachment-upload preview v-else-if="block.type === 'custom' && block.slotKind === 'files'" v-model:value="block.files" />
      <a-flex vertical gap="small" v-else-if="block.type === 'custom' && block.slotKind === 'reference'">
        <l-chat-message-reference
          @click="emit('jumpToReference', r)" class="w-50 cursor-pointer"
          :message="r"
          :key="r.id"
          v-for="r of block.value"
        />
      </a-flex>
    </template>
  </a-flex>
</template>
