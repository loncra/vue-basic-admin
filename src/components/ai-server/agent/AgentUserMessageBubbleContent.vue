<script setup lang="ts">

import LSenderSoldBubbleContent from "@/components/basic/chat/SenderSlotBubbleContent.vue";
import type {ChatContentBlock} from "@/types/composables";

defineOptions({
  name: 'LAgentUserMessageBubbleContent',
})

defineProps<{
  content: ChatContentBlock[]
}>()

</script>

<template>
  <l-sender-sold-bubble-content
    :content="content.filter(c => !(c.type === 'custom' && c.slotKind === 'files'))"
  >
  </l-sender-sold-bubble-content>
</template>
