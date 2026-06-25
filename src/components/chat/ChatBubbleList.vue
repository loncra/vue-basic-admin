<script setup lang="ts">

import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {CHAT_BUBBLE_TYPE} from "@/constants/messageConstant.ts";
import {AuthServerService} from "@/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import LChatMessageReadTable from "@/components/chat/ChatMessageReadTable.vue";
import {type ComponentInternalInstance, getCurrentInstance} from "vue";
import type {ChatContentBlock} from "@/types/composables";
import {BubbleList as AxBubbleList} from "@antdv-next/x";
import type {UserChatMessageResponseBody} from "@/types/apis";
import {useChatBubbleList, useChatContext} from "@/composables/chat";

defineOptions({
  name: 'LChatBubbleList',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  scrollToBottomThreshold?:number
  throttleOnScrollWait?:number
  throttleCollectVisibleUnreadWait?:number,
  topThreshold?:number
  timeDividerGap?:number
}>(),{
  throttleCollectVisibleUnreadWait:500,
  throttleOnScrollWait:300,
  topThreshold:250,
  scrollToBottomThreshold:100,
  timeDividerGap:5 * 60 * 1000
})

const emit = defineEmits<{
  reedit:[content: ChatContentBlock[]]
  referenceMessage:[message:UserChatMessageResponseBody]
}>()

const {conversationActive: conversation, loader} = useChatContext()

const {
  bubbleListRef,
  bubbleListItems,
  bubbleListRole,
  showScrollToBottom,
  onBubbleScroll,
  jumpToBottom,
  jumpToMessage,
  reedit,
  addRefMessage,
  onUndoMessage,
  getScrollBox,
  scrollTo,
} = useChatBubbleList(conversation, props, {
  onLoadPage: (tag) => loader.loadMore(tag),
  onReloadLastPage: () => {
    const item = conversation.value.item
    if (item) {
      loader.switchConversation(item, true)
    }
  },
  onReedit: (content) => emit('reedit', content),
  onReferenceMessage: (message) => emit('referenceMessage', message),
})

defineExpose({
  getScrollBox,
  jumpToMessage,
  scrollTo,
})
</script>

<template>
  <a-flex class="h-full min-h-0 overflow-hidden relative flex-[1_1_0]">
    <ax-bubble-list
      ref="bubbleListRef"
      class="min-h-0 h-full flex"
      :classes="{scroll:'pl-xs pr-xs'}"
      :items="bubbleListItems"
      @scroll="onBubbleScroll"
      :role="bubbleListRole"
    >
      <template #extra="{item}" >
        <a-flex class="h-full" justify="end" align="end">
          <a-tooltip
            v-if="getEnumValue(conversation.item?.data?.room?.type) === 20 && item.role === CHAT_BUBBLE_TYPE.USER"
            :title="item.data.readableCount === 1 ? globalProperties.$t('common.read.readable') : globalProperties.$t('common.read.unreadable')"
          >
            <a-typography-text :type="item.data.readableCount === 1 ? 'secondary' : 'success'">
              <icon-font class="icon" :type="item.data.readableCount === 1 ? 'loncra-eye-off' : 'loncra-eye'" />
            </a-typography-text>
          </a-tooltip>
          <a-popover
            :placement="item.role === CHAT_BUBBLE_TYPE.USER ? 'left' : 'right'"
            v-else-if="getEnumValue(conversation.item?.data?.room?.type) === 10 && item.data"
            trigger="click"
          >
            <template #content>
              <l-chat-message-read-table :message-id="item.data.id" />
            </template>

            <a-button
              :color="Math.abs(item.data.readableCount - item.data.readCount) < item.data.readCount ? undefined : 'lime'"
              size="small"
              :variant="Math.abs(item.data.readableCount - item.data.readCount) >= item.data.readCount ? 'filled' : undefined"
              type="dashed"
            >
              <a-space v-if="Math.abs(item.data.readableCount - item.data.readCount) < item.data.readCount">
                <a-badge status="processing" />
                {{Math.abs(item.data.readableCount - item.data.readCount)}} / {{item.data.readCount}}
              </a-space>
              <template #icon v-if="Math.abs(item.data.readableCount - item.data.readCount) >= item.data.readCount">
                <icon-font type="loncra-list-checks"/>
              </template>
            </a-button>
          </a-popover>
        </a-flex>
      </template>
      <template #avatar="{ item }">
        <l-user-avatar
          size="large"
          :user="item.data?.participant?.metadata?.details"
        />
      </template>
      <template #header="{ item }">
        <a-typography-text v-if="item.role === 'ai'">
          <template v-if="getEnumValue(conversation.item?.data?.room?.type) === 10">
            {{ AuthServerService.getPrincipalNameByUserDetails(item.data.participant.metadata.details) }}
          </template>
          <template v-if="getEnumValue(conversation.item?.data?.room?.type) === 20">
            {{ (conversation.item?.label || globalProperties.$t('common.unname'))}}
          </template>
        </a-typography-text>
        <a-typography-text type="secondary" v-else>
          {{globalProperties.$t('common.me')}}
        </a-typography-text>
      </template>
      <template #footer="{role, item}">
        <a-flex class="w-full" gap="small" :class="role === CHAT_BUBBLE_TYPE.USER ? '' : 'flex-row-reverse'">
          <a-tooltip :title="globalProperties.$t('chat.view.reedit')" v-if="getEnumValue(item.data.undo) === 1" >
            <a-button size="small" type="text" @click="reedit(item.data)">
              <icon-font type="loncra-message-square-reply"/>
            </a-button>
          </a-tooltip>
          <a-tooltip :title="globalProperties.$t('chat.view.reference')" >
            <a-button size="small" :disabled="getEnumValue(item.data.undo) === 1" type="text" @click="addRefMessage(item.data)">
              <icon-font type="loncra-text-quote"/>
            </a-button>
          </a-tooltip>
          <a-tooltip :title="globalProperties.$t('chat.view.undo.action')">
            <a-button size="small" :disabled="getEnumValue(item.data.undo) === 1" type="text" danger @click="onUndoMessage(item.data)" v-if="role === CHAT_BUBBLE_TYPE.USER">
              <icon-font type="loncra-undo"/>
            </a-button>
          </a-tooltip>
        </a-flex>
      </template>
    </ax-bubble-list>
    <slot name="bubbleListAfter"></slot>
    <a-space-compact class="absolute bottom-0 mb-sm left-1/2 -translate-x-1/2 animate-bounce">
      <a-button
        shape="circle"
        class="shadow-card"
        v-if="showScrollToBottom"
        @click="jumpToBottom('bottom')"
      >
        <template #icon>
          <icon-font type="loncra-hard-drive-download"/>
        </template>
      </a-button>
    </a-space-compact>

  </a-flex>
</template>

