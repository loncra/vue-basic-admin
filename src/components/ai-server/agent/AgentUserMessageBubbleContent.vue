<script setup lang="ts">

import {SenderSlotBubbleContent as LSenderSoldBubbleContent} from '@loncra/antdv-chat'
import type {ChatContentBlock} from "@/types/composables";
import type {AgentChatBubble} from '@loncra/chat-core'

defineOptions({
  name: 'LAgentUserMessageBubbleContent',
})

defineProps<{
  item: AgentChatBubble & {reedit?: boolean}
}>()

</script>

<template>
  <a-typography-text :delete="item.reedit" :type="item.reedit ? 'secondary' : 'default'">
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
