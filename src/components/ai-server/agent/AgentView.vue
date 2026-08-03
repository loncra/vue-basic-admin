<script setup lang="ts">
import {computed} from 'vue'
import {Welcome as AxWelcome} from '@antdv-next/x'
import {AGENT_CHAT_STATUS, CHAT_BUBBLE_TYPE} from '@/constants'
import LUserAvatar from '@/components/basic/UserAvatar.vue'
import LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import LAgentUserMessageBubbleContent
  from '@/components/ai-server/agent/AgentUserMessageBubbleContent.vue'
import LAgentAssistantBubbleContent
  from '@/components/ai-server/agent/AgentAssistantBubbleContent.vue'
import LBubbleList from '@/components/basic/chat/BubbleList.vue'
import {createAgentBubbleListRole, useAgentView} from '@/composables'
import type {AgentMessageEntity, StreamAgentMessageEntity} from "@/types/apis";
import {getEnumValue} from "@/utils";

defineOptions({
  name: 'LAgentView',
})

const {
  onSenderSubmit,
  principalStore,
  conversationActive,
  loader,
  countTokenUsage,
  bubbleListRef,
  onResume,
  copyText,
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
            :item="item"
          />
          <l-agent-user-message-bubble-content
            v-else
            :content="Array.isArray(item.content) ? item.content : []"
          />
        </template>
        <template #footer="{item}">
          <template v-if="item.role === CHAT_BUBBLE_TYPE.AI && getEnumValue((item.data as AgentMessageEntity).status) !== AGENT_CHAT_STATUS.RUNNING">
            <a-space>
              <a-button variant="outlined" size="small" :color="(item.data as StreamAgentMessageEntity).copy ? 'cyan' : 'default'" @click="copyText(item.data as StreamAgentMessageEntity)">
                <template #icon>
                  <icon-font :type="(item.data as StreamAgentMessageEntity).copy ? 'loncra-copy-check' : 'loncra-copy'" />
                </template>
              </a-button>
              <a-button size="small" variant="dashed">
                <template #icon>
                  <icon-font type="loncra-database-zap" />
                </template>
                {{ $t('agent.token.text') }}:{{countTokenUsage(item)}}
              </a-button>
            </a-space>
          </template>
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
