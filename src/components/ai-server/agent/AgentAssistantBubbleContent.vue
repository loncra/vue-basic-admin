<script setup lang="ts">
import type {AgentToolCallBlock, ChatBubbleItem,} from '@/types/composables'
import {
  Bubble as AxBubble,
  Sources as AxSources,
  Think as AxThink,
  ThoughtChain as AxThoughtChain
} from "@antdv-next/x"
import {AGENT_TOOL_BLOCK_STATUS} from "@/constants"
import LMarkdownCodeRenderer from "@/components/basic/markdown/MarkdownCodeRenderer.vue"
import LMarkdown from "@/components/basic/markdown/Markdown.vue"

import {RightOutlined,} from '@antdv-next/icons'
import {
  getTavilyExtractResult,
  getTavilySearchSourceConfig,
  isBlockRunning,
  useAgentAssistantBubble
} from "@/composables";
import {hasToolConfirmed} from "@/composables/ai-server/agent/useAgentAssistantBubble.ts";

defineOptions({
  name: 'LAgentAssistantBubbleContent',
})

const model = defineModel<ChatBubbleItem>("item", {default:() => []})

const {
  toggleToolCallExpanded,
  clickToolConfirmed,
  toolCallExpandedState,
  groupedBlocks,
  hasContent,
  toThoughtChainItem,
} = useAgentAssistantBubble(model.value)

</script>

<template>
  <a-flex vertical gap="small" v-if="hasContent()">
    <template v-for="group of groupedBlocks" :key="group.groupId">

      <!-- 思考 -->
      <a-card v-if="group.thinkBlock" :classes="{ body: 'p-xs' }">
        <ax-think
          :classes="{ content: 'ml-xxs' }"
          :title="$t('agent.think')"
          :default-expanded="false"
          v-model:expanded="group.thinkBlock.expanded"
          :blink="isBlockRunning(group.thinkBlock)"
          :loading="isBlockRunning(group.thinkBlock)"
        >
          <l-markdown
            :content="group.thinkBlock.value!"
            :components="{ code: LMarkdownCodeRenderer }"
            paragraph-tag="div"
            :streaming="{ hasNextChunk: isBlockRunning(group.thinkBlock) }"
            open-links-in-new-tab
          />
        </ax-think>
      </a-card>

      <!-- 回答 -->
      <ax-bubble v-if="group.answerBlock" class="p-0!" content=" ">
        <template #content>
          <l-markdown
            :content="group.answerBlock.value!"
            :components="{ code: LMarkdownCodeRenderer }"
            paragraph-tag="div"
            :streaming="{ hasNextChunk: isBlockRunning(group.answerBlock) }"
            open-links-in-new-tab
          />
        </template>
      </ax-bubble>

      <!-- 工具调用 → 思维链 -->
      <a-card
        class="l-agent-bubble-content-tool-call-card"
        v-if="group.toolBlocks.length > 0"
        size="small"
        :classes="{ body: '!p-0' }"
      >
        <template #title>
          <a-space>
            <icon-font type="loncra-square-terminal" />
            <span>
              {{$t('agent.toolCall.text')}}
            </span>
            <RightOutlined
              v-if="!hasToolConfirmed(group.toolBlocks)"
              class="text-xs text-text-quaternary cursor-pointer transition-transform duration-300"
              :class="{ 'rotate-90': toolCallExpandedState[group.groupId] }"
              @click.stop="toggleToolCallExpanded(group.groupId)"
            />
          </a-space>
        </template>
        <Transition name="tool-call-expand">
          <div class="p-sm" v-if="toolCallExpandedState[group.groupId]" key="expanded">
            <ax-thought-chain
              :items="group.toolBlocks.map(toThoughtChainItem)"
              :classes="{ itemContent: 'overflow-auto' }"
            >
              <template #content="{ item }">
                <div class="max-h-[40vh] overflow-auto">
                  <ax-sources
                    class="l-web-search-sources"
                    v-if="item.title === 'tavily_search' && item.data?.outputText && item.data.resultState === 'success'"
                    expand-icon-position="end"
                    v-bind="getTavilySearchSourceConfig(item.data?.outputText)"
                  >
                    <template #iconRender="{item}">
                      <a-avatar size="small" :src="item.favicon" />
                    </template>
                  </ax-sources>

                  <a-space
                    orientation="vertical"
                    v-else-if="item.title === 'tavily_extract' && item.data?.outputText && item.data.resultState === 'success'"
                  >
                    <a-popover
                      :classes="{root:'max-w-[40vw] ',content: 'max-h-[30vh] overflow-auto p-xs', title:'p-xs mb-0 border-b border-border-secondary border-solid', container: 'p-0'}"
                      v-for="result of getTavilyExtractResult(item.data?.outputText)"
                      :key="result.url"
                      :title="result.title"
                    >
                      <template #content v-if="result['raw_content']">
                        <l-markdown
                          :content="result['raw_content']"
                          :components="{ code: LMarkdownCodeRenderer }"
                          paragraph-tag="div"
                          open-links-in-new-tab
                        />
                      </template>
                      <a-typography-link :href="result.url" target="_blank">
                        {{ result.title }}
                      </a-typography-link>
                    </a-popover>
                  </a-space>

                  <l-markdown
                    v-else-if="item.data?.outputText"
                    :content="item.data?.outputText"
                    :components="{ code: LMarkdownCodeRenderer }"
                    paragraph-tag="div"
                    open-links-in-new-tab
                  />
                </div>
              </template>
              <template #footer="{ item }">
                <a-space v-if="item.data.hitlStatus === AGENT_TOOL_BLOCK_STATUS.PENDING && item.data.userConfirmed === undefined">
                  <a-button type="primary" @click="clickToolConfirmed(item.data as AgentToolCallBlock, true)">
                    <template #icon>
                      <icon-font type="loncra-clipboard-check" />
                    </template>
                    {{$t('agent.toolCall.hitl.confirm')}}
                  </a-button>
                  <a-button @click="clickToolConfirmed(item.data as AgentToolCallBlock, false)">
                    <template #icon>
                      <icon-font type="loncra-clipboard-x" />
                    </template>
                    {{$t('agent.toolCall.hitl.cancel')}}
                  </a-button>
                </a-space>
              </template>
            </ax-thought-chain>
          </div>
        </Transition>
      </a-card>

      <!-- 错误 -->
      <a-alert
        v-if="group.errorBlock"
        type="error"
        show-icon
        :message="group.errorBlock.metadata.message"
      />
    </template>
  </a-flex>

  <!-- 空内容 → loading dots -->
  <span v-else class="antd-bubble-dot">
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
  </span>
</template>
