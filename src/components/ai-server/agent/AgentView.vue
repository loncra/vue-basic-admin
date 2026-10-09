<script setup lang="ts">
import {computed} from 'vue'
import LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import {AgentBubbleList as LAgentBubbleList, type BubbleListExpose} from '@loncra/antdv-chat-pro'
import {useAgentView} from '@/composables'

defineOptions({
  name: 'LAgentView',
})

const {
  onSenderSubmit,
  onSenderCancel,
  principalStore,
  conversationActive,
  stream,
  bubbleListRef,
  senderRef,
  getSenderSlotConfigValue,
  persistSenderDraft,
  onAppliedSlots,
} = useAgentView()

function bubbleList(): BubbleListExpose | undefined {
  return bubbleListRef.value as BubbleListExpose | undefined
}

const hasMessages = computed(
  () => (conversationActive.value?.dataSource.elements.length ?? 0) > 0,
)

function onResume(id: number) {
  stream.connect(id, false)
}

defineExpose({
  getScrollBox: () => bubbleList()?.getScrollBox(),
  jumpToMessage: (
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ) => bubbleList()?.jumpToMessage(key, flashPending, block, behavior),
  scrollTo: (options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }) => bubbleList()?.scrollTo(options),
  getSenderSlotConfigValue,
  persistSenderDraft,
})
</script>

<template>
  <a-flex vertical flex="1" class="h-full min-h-0 overflow-hidden">
    <a-flex class="h-full min-h-0 overflow-hidden relative flex-[1_1_0]">
      <l-agent-bubble-list
        v-if="conversationActive && hasMessages"
        ref="bubbleListRef"
        :session="conversationActive"
        :user="principalStore.state.details.metadata"
        @resume="onResume"
      >
        <template #assistantAvatar>
          <a-avatar>
            <icon-font type="icon-xiaojiage-a" />
          </a-avatar>
        </template>
        <template v-if="$slots.bubbleListAfter" #bubbleListAfter>
          <slot name="bubbleListAfter" />
        </template>
      </l-agent-bubble-list>
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
      <!-- :key 按会话重建。草稿由 DraftSender 自己防抖和还原，不要把输入写回 :slot-config。 -->
      <l-agent-sender
        ref="senderRef"
        :key="String(conversationActive?.id ?? '')"
        :target-id="conversationActive?.id == null ? '' : String(conversationActive.id)"
        :slot-config="conversationActive?.draft"
        @applied-slots="onAppliedSlots"
        @submit="onSenderSubmit"
        @cancel="onSenderCancel"
      />
    </div>
  </a-flex>
</template>
