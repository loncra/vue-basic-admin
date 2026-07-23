<script setup lang="ts">
import {computed} from 'vue'
import {Welcome as AxWelcome} from '@antdv-next/x'
import {XMarkdown} from '@antdv-next/x-markdown'
import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import {CHAT_BUBBLE_TYPE} from '@/constants'
import LUserAvatar from '@/components/basic/UserAvatar.vue'
import LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import LAgentUserMessageBubbleContent
  from '@/components/ai-server/agent/AgentUserMessageBubbleContent.vue'
import LBubbleList from '@/components/basic/chat/BubbleList.vue'
import {useAgentView} from '@/composables'
import {DEFAULT_BUBBLE_LIST_ROLE} from '@/composables/chat/useBubbleList.ts'

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
        :role="DEFAULT_BUBBLE_LIST_ROLE"
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
        <template #contentRender="{ item, content }">
          <x-markdown
            v-if="item.role === CHAT_BUBBLE_TYPE.AI && typeof content === 'string'"
            :content="content"
            open-links-in-new-tab
            escape-raw-html
          />
          <l-agent-user-message-bubble-content v-else :content="item.content" />
        </template>
        <template v-if="$slots.bubbleListAfter" #bubbleListAfter>
          <slot name="bubbleListAfter" />
        </template>
      </l-bubble-list>
      <a-flex v-else justify="center" align="center" class="size-full">
        <ax-welcome
          variant="borderless"
          title="你好，我是 Captain.J"
          description="今天有什么需要干的吗？"
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
