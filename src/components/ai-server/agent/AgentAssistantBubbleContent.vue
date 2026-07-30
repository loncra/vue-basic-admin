<script setup lang="ts">

import type {
  BlockRunningContentMetadata,
  AgentErrorBlock,
  AgentSseMessageContent,
  AgentAnswerBlock, AgentThinkBlock, AgentToolCallBlock,
} from '@/types/composables'
import {AGENT_BLOCK_STATUS, AGENT_CONTENT_TYPE} from "@/constants";
import LMarkdownCodeRenderer from "@/components/basic/markdown/MarkdownCodeRenderer.vue";
import {getEnumValue} from "@/utils";
import LMarkdown from "@/components/basic/markdown/Markdown.vue";
import {Think as AxThink, ThoughtChainItem as AxThoughtChainItem} from "@antdv-next/x"
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
    <template :key="c.id + c.type" v-for="c of props.content">
      <l-markdown
        v-if="c.type === AGENT_CONTENT_TYPE.ANSWER"
        :content="(c as AgentAnswerBlock).value"
        :components="{
          code: LMarkdownCodeRenderer
        }"
        paragraph-tag="div"
        :streaming="{
          hasNextChunk: getEnumValue((c as BlockRunningContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING
        }"
        open-links-in-new-tab
      />
      <ax-thought-chain-item
        variant="solid"
        class="items-center"
        :blink="getEnumValue((c as BlockRunningContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING"
        v-if="c.type === AGENT_CONTENT_TYPE.TOOL"
        :description="(c as AgentToolCallBlock).name"
      >
        <template #title>
          <a-space>
            <icon-font type="loncra-square-terminal" />
            {{$t('agent.toolCall')}}
          </a-space>
        </template>
      </ax-thought-chain-item>
      <ax-think
        v-if="c.type === AGENT_CONTENT_TYPE.THINK"
        :title="$t('agent.think')"
        :default-expanded="false"
        v-model:expanded="(c as AgentThinkBlock).expanded"
        :blink="getEnumValue((c as BlockRunningContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING"
        :loading="getEnumValue((c as BlockRunningContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING"
      >
        <l-markdown
          :content="(c as AgentThinkBlock).value"
          :components="{
          code: LMarkdownCodeRenderer
        }"
          paragraph-tag="div"
          :streaming="{
          hasNextChunk: getEnumValue((c as BlockRunningContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING
        }"
          open-links-in-new-tab
        />
      </ax-think>
      <a-alert
        v-if="c.type === AGENT_CONTENT_TYPE.ERROR"
        type="error"
        show-icon
        :message="(c as AgentErrorBlock).metadata.message"
      />
    </template>
  </a-flex>
  <span v-else class="antd-bubble-dot">
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
  </span>
</template>
