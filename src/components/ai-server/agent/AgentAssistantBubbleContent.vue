<script setup lang="ts">

import type {
  BlockRunningContentMetadata,
  AgentErrorBlock,
  AgentSseMessageContent,
  BlockDeltaContentMetadata,
} from '@/types/composables'
import {AGENT_BLOCK_STATUS, AGENT_CONTENT_TYPE} from "@/constants";
import LMarkdownCodeRenderer from "@/components/basic/markdown/MarkdownCodeRenderer.vue";
import {getEnumValue} from "@/utils";
import LMarkdown from "@/components/basic/markdown/Markdown.vue";

defineOptions({
  name: 'LAgentAssistantBubbleContent',
})

const props = withDefaults(defineProps<{
  content: AgentSseMessageContent[]
}>(),{
  content: () => [],
})

</script>

<template>
  <a-flex vertical gap="small" v-if="props.content.length > 0">
    <l-markdown
      :content="content.filter((s) => s.type === AGENT_CONTENT_TYPE.ANSWER).map((s) => (s as BlockDeltaContentMetadata).value || '').join()"
      :components="{
        code: LMarkdownCodeRenderer
      }"
      paragraph-tag="div"
      :streaming="{
        hasNextChunk:props.content.some(s => getEnumValue((s as BlockRunningContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING)
      }"
      open-links-in-new-tab
    />
    <template
      :key="error.id"
      v-for="error of props.content.filter(s => s.type === AGENT_CONTENT_TYPE.ERROR) as AgentErrorBlock[]"
    >
      <a-alert
        type="error"
        show-icon
        :message="error.metadata.message"
      />
    </template>
  </a-flex>
  <span v-else class="antd-bubble-dot">
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
  </span>
</template>
