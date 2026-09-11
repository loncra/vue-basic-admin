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
  <a-typography-text :delete="(item.data as StreamAgentMessageEntity).reedit" :type="(item.data as StreamAgentMessageEntity).reedit ? 'secondary' : 'default'">
    <l-sender-sold-bubble-content
      :content="(item.content as ChatContentBlock[]).filter(c => !(c.type === 'custom' && c.slotKind === 'files'))"
    >
      <template #renderBlock="{block:block}">
        <a-tag variant="outlined" v-if="block.type === 'custom' && block.slotKind === 'instruction'">
          <template #icon v-if="block.prefix === '/skill'">
            <icon-font type="loncra-sparkles" />
          </template>
          <template #icon v-else-if="block.prefix === '/mcp'">
            <icon-font type="loncra-plug-zap" />
          </template>
          {{ block.value.value }}
        </a-tag>
      </template>
    </l-sender-sold-bubble-content>
  </a-typography-text>
</template>
