<script setup lang="ts">

import {SenderSlotBubbleContent as LSenderSlotBubbleContent} from "@loncra/antdv-chat";
import type {ChatBubbleRenderItem, ChatContentBlock} from "@/types/composables";
import type {StreamAgentMessageEntity} from "@/types/apis";

defineOptions({
  name: 'LAgentUserMessageBubbleContent',
})

// 收的是**渲染项**（x 插槽给的：content 由 `toBubbleContent` 派生）—— A1，2026-10-01 S2b-2
defineProps<{
  item: ChatBubbleRenderItem
}>()

</script>

<template>
  <a-typography-text :delete="(item.data as StreamAgentMessageEntity).reedit" :type="(item.data as StreamAgentMessageEntity).reedit ? 'secondary' : 'default'">
    <l-sender-slot-bubble-content
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
    </l-sender-slot-bubble-content>
  </a-typography-text>
</template>
