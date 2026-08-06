<script setup lang="ts">

import LSenderSoldBubbleContent from "@/components/basic/chat/SenderSlotBubbleContent.vue";
import type {ChatBubbleItem, ChatContentBlock} from "@/types/composables";
import type {StreamAgentMessageEntity} from "@/types/apis";

defineOptions({
  name: 'LAgentUserMessageBubbleContent',
})

defineProps<{
  item: ChatBubbleItem
}>()

</script>

<template>
  <a-typography-text :delete="(item.data as StreamAgentMessageEntity).reedit">
    <l-sender-sold-bubble-content
      :content="(item.content as ChatContentBlock[]).filter(c => !(c.type === 'custom' && c.slotKind === 'files'))"
    >
    </l-sender-sold-bubble-content>
  </a-typography-text>
</template>
