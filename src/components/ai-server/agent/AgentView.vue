<script setup lang="ts">
import {computed} from 'vue'
import {ThoughtChain as AxThoughtChain, Welcome as AxWelcome} from '@antdv-next/x'
import {CHAT_BUBBLE_TYPE} from '@/constants'
import LUserAvatar from '@/components/basic/UserAvatar.vue'
import LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import LAgentUserMessageBubbleContent
  from '@/components/ai-server/agent/AgentUserMessageBubbleContent.vue'
import LAgentAssistantBubbleContent
  from '@/components/ai-server/agent/AgentAssistantBubbleContent.vue'
import LBubbleList from '@/components/basic/chat/BubbleList.vue'
import {createAgentBubbleListRole, useAgentView} from '@/composables'

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
  getThoughtChainConfig,
  onThoughtChainExpand,
  getAiBubbleContents,
  bubbleListRef,
  senderRef,
} = useAgentView()

const hasMessages = computed(
  () => (conversationActive.value?.dataSource.elements.length ?? 0) > 0,
)

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
            :content="getAiBubbleContents(item)"
          />
          <l-agent-user-message-bubble-content
            v-else
            :content="Array.isArray(item.content) ? item.content : []"
          />
        </template>
        <template #header="{item}">
          <a-card size="small" v-if="item.role === CHAT_BUBBLE_TYPE.AI">
            <ax-thought-chain
              :classes="{itemHeader: 'text-text-quaternary'}"
              v-bind="getThoughtChainConfig(item)"
              @expand="(keys: string[]) => onThoughtChainExpand(item.key, keys)"
              line="dashed"
            >
              <template #content="{item:thoughtChainItem}">
                <x-markdown
                  :content="thoughtChainItem.content"
                  paragraph-tag="div"
                  :streaming="{
                    hasNextChunk:thoughtChainItem.blink
                  }"
                  open-links-in-new-tab
                />
              </template>
            </ax-thought-chain>
          </a-card>
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
