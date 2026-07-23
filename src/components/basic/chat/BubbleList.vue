<script setup lang="ts">
import {computed, toRef} from 'vue'
import type {ActiveChatSession, BubbleListCallbacks, ChatBubbleItem} from '@/types/composables'
import {BubbleList as AxBubbleList} from '@antdv-next/x'
import type {BubbleItemType, RoleType} from '@antdv-next/x/dist/bubble/interface'
import {DEFAULT_BUBBLE_LIST_ROLE, useBubbleList} from '@/composables/chat/useBubbleList.ts'

defineOptions({
  name: 'LBubbleList',
})

const props = withDefaults(
  defineProps<{
    session: ActiveChatSession
    /** 为 true 时启用可见区探测（IM 已读）；Agent 保持 false */
    collectVisible?: boolean
    scrollToBottomThreshold?: number
    throttleOnScrollWait?: number
    throttleCollectVisibleWait?: number
    topThreshold?: number
    role?: RoleType,
    renderItem?:(items:ChatBubbleItem[]) => BubbleItemType[]
  }>(),
  {
    collectVisible: false,
    throttleCollectVisibleWait: 500,
    throttleOnScrollWait: 300,
    topThreshold: 250,
    scrollToBottomThreshold: 100,
    renderItem:(items:ChatBubbleItem[]) => [...items.filter((s) => !s.hide)]
  },
)

const emit = defineEmits<{
  loadPage: [tag: 'next' | 'previous', scrollBox: HTMLElement]
  reloadLastPage: []
  visibleItems: [items: ChatBubbleItem[], scrollBox: HTMLElement]
}>()

const sessionRef = toRef(props, 'session')

const listProps = computed(() => ({
  scrollToBottomThreshold: props.scrollToBottomThreshold,
  throttleOnScrollWait: props.throttleOnScrollWait,
  throttleCollectVisibleWait: props.throttleCollectVisibleWait,
  topThreshold: props.topThreshold,
}))

const callbacks: BubbleListCallbacks = {
  onLoadPage: (tag, scrollBox) => emit('loadPage', tag, scrollBox),
  onReloadLastPage: () => emit('reloadLastPage'),
  onVisibleItems: props.collectVisible
    ? (items, scrollBox) => emit('visibleItems', items, scrollBox)
    : undefined,
  renderItem:props.renderItem
}

const {
  bubbleListRef,
  bubbleListItems,
  bubbleListRole,
  showScrollToBottom,
  onBubbleScroll,
  jumpToBottom,
  jumpToMessage,
  getVisibleItems,
  getScrollBox,
  scrollTo,
} = useBubbleList(sessionRef, listProps, callbacks)

const resolvedRole = computed(() => props.role ?? bubbleListRole ?? DEFAULT_BUBBLE_LIST_ROLE)

defineExpose({
  getScrollBox,
  getVisibleItems,
  jumpToMessage,
  jumpToBottom,
  scrollTo,
})
</script>

<template>
  <a-flex class="h-full min-h-0 overflow-hidden relative flex-[1_1_0]">
    <ax-bubble-list
      ref="bubbleListRef"
      class="min-h-0 h-full flex"
      :classes="{ scroll: 'pl-xs pr-xs' }"
      :items="bubbleListItems"
      :role="resolvedRole"
      @scroll="onBubbleScroll"
    >
      <template v-if="$slots.extra" #extra="slotProps">
        <slot name="extra" v-bind="slotProps" />
      </template>
      <template v-if="$slots.avatar" #avatar="slotProps">
        <slot name="avatar" v-bind="slotProps" />
      </template>
      <template v-if="$slots.header" #header="slotProps">
        <slot name="header" v-bind="slotProps" />
      </template>
      <template v-if="$slots.contentRender" #contentRender="slotProps">
        <slot name="contentRender" v-bind="slotProps" />
      </template>
    </ax-bubble-list>
    <slot name="bubbleListAfter" />
    <a-space-compact class="absolute bottom-0 mb-sm left-1/2 -translate-x-1/2 animate-bounce">
      <a-button
        v-if="showScrollToBottom"
        shape="circle"
        class="shadow-card"
        @click="jumpToBottom('bottom')"
      >
        <template #icon>
          <icon-font type="loncra-hard-drive-download" />
        </template>
      </a-button>
    </a-space-compact>
  </a-flex>
</template>
