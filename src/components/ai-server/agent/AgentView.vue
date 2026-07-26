<script setup lang="ts">
import {computed} from 'vue'
import {
  ThoughtChain as AxThoughtChain,
  type ThoughtChainItemType,
  Welcome as AxWelcome
} from '@antdv-next/x'
import {
  AGENT_CONTENT_TYPE,
  AGENT_TOOL_BLOCK_STATUS,
  CHAT_BUBBLE_TYPE,
  THOUGHT_CHAIN_TYPES
} from '@/constants'
import LUserAvatar from '@/components/basic/UserAvatar.vue'
import LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import LAgentUserMessageBubbleContent
  from '@/components/ai-server/agent/AgentUserMessageBubbleContent.vue'
import LAgentAssistantBubbleContent
  from '@/components/ai-server/agent/AgentAssistantBubbleContent.vue'
import LBubbleList from '@/components/basic/chat/BubbleList.vue'
import {createAgentBubbleListRole, useAgentView} from '@/composables'
import type {AgentSseMessageContent, AgentThinkBlock, AgentToolBlock} from "@/types/composables";
import {getEnumName, getEnumValue} from "@/utils";

import {XMarkdown} from '@antdv-next/x-markdown'
import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'

defineOptions({
  name: 'LAgentView',
})

const {
  onSenderSubmit,
  principalStore,
  conversationActive,
  loader,
  bubbleListRef,
  senderRef,
} = useAgentView()

const hasMessages = computed(
  () => (conversationActive.value?.dataSource.elements.length ?? 0) > 0,
)
const thoughtItems = computed<ThoughtChainItemType[]>(() => {
  const items: ThoughtChainItemType[] = []
  if (!conversationActive.value) {
    return items
  }
  const contents = conversationActive.value
    .dataSource
    .elements
    .filter(s => s.role === CHAT_BUBBLE_TYPE.AI)
    .flatMap(s => s.content)
    .map(s => s as AgentSseMessageContent)
  for (const block of contents.filter(s => THOUGHT_CHAIN_TYPES.includes(s.type))) {
    if (block.type === AGENT_CONTENT_TYPE.THINK) {
      const think = block as AgentThinkBlock
      items.push({
        key: think.id,
        title: '思考',
        content: think.value || '',
        status: think.value ? 'success' : 'loading',
        collapsible: true,
      })
      continue
    }
    if (block.type === AGENT_CONTENT_TYPE.TOOL) {
      const tool = block as AgentToolBlock
      items.push({
        key: tool.id,
        title: tool.name,
        description: getEnumName(tool.status),
        content: formatToolContent(tool),
        status: mapToolStatus(getEnumValue(tool.status)),
        collapsible: true,
      })
    }
  }
  return items
})

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function mapToolStatus(status?: string): ThoughtChainItemType['status'] {
  if (status === AGENT_TOOL_BLOCK_STATUS.DONE) {
    return 'success'
  }
  if (status === AGENT_TOOL_BLOCK_STATUS.FAILED) {
    return 'error'
  }
  return 'loading'
}

function formatToolContent(tool: AgentToolBlock): string {
  const parts: string[] = []
  if (tool.input !== undefined && tool.input !== null) {
    parts.push(`输入：${stringify(tool.input)}`)
  }
  if (tool.output !== undefined && tool.output !== null) {
    parts.push(`输出：${stringify(tool.output)}`)
  }
  return parts.join('\n')
}

function onLoadPage(tag: 'next' | 'previous') {
  void loader.loadMore(tag)
}

defineExpose({
  getScrollBox: () => bubbleListRef.value?.getScrollBox(),
  jumpToMessage: (
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ) => bubbleListRef.value?.jumpToMessage(key, flashPending, block, behavior),
  scrollTo: (options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }) => bubbleListRef.value?.scrollTo(options),
})
</script>

<template>
  <a-flex vertical flex="1" class="h-full min-h-0 overflow-hidden">
    <a-flex class="h-full min-h-0 overflow-hidden relative flex-[1_1_0]">
      <l-bubble-list
        v-if="conversationActive && hasMessages"
        ref="bubbleListRef"
        :session="conversationActive"
        :role="createAgentBubbleListRole()"
        @load-page="onLoadPage"
      >
        <template #avatar="{ item }">
          <l-user-avatar
            v-if="item.role === CHAT_BUBBLE_TYPE.USER"
            size="large"
            :user="principalStore.state.details.metadata"
          />
          <a-avatar v-else>
            <icon-font type="icon-xiaojiage-a" />
          </a-avatar>
        </template>
        <template #contentRender="{ item }">
          <l-agent-assistant-bubble-content
            v-if="item.role === CHAT_BUBBLE_TYPE.AI"
            :content="item.content"
          />
          <l-agent-user-message-bubble-content
            v-else
            :content="Array.isArray(item.content) ? item.content : []"
          />
        </template>
        <template #header="{item}">
          <ax-thought-chain v-if="item.role === CHAT_BUBBLE_TYPE.AI && thoughtItems.length > 0" :items="thoughtItems" line="dashed">
            <template #content="{item:tItem}">
              {{tItem.content}}
              <x-markdown :content="tItem.content" />
            </template>
          </ax-thought-chain>
        </template>
        <template v-if="$slots.bubbleListAfter" #bubbleListAfter>
          <slot name="bubbleListAfter" />
        </template>
      </l-bubble-list>
      <a-flex v-else justify="center" align="center" class="size-full">
        <ax-welcome
          variant="borderless"
          :title="$t('agent.welcome.title')"
          :description="$t('agent.welcome.description')"
        >
          <template #icon>
            <icon-font class="text-5xl" type="icon-xiaojiage-a" />
          </template>
        </ax-welcome>
      </a-flex>
    </a-flex>
    <div class="shrink-0 p-sm border-t border-t-border-secondary">
      <l-agent-sender ref="senderRef" @submit="onSenderSubmit" />
    </div>
  </a-flex>
</template>
