<script setup lang="ts">

import {createIcon, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {CHAT_BUBBLE_TYPE} from "@/constants/messageConstant.ts";
import {AuthServerService} from "@/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import LChatMessageReadTable from "@/components/chat/ChatMessageReadTable.vue";
import {type ComponentInternalInstance, getCurrentInstance, h, ref} from "vue";
import type {ChatBubbleItem, ChatContentBlock} from "@/types/composables";
import {BubbleList as AxBubbleList} from "@antdv-next/x";
import {StatisticTimer, Space} from "antdv-next";
import type {UserChatMessageResponseBody} from "@/types/apis";
import {useChatBubbleList, useChatContext} from "@/composables/chat";
import type {MenuItemType} from "antdv-next";
import LChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";

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
const principalStore = usePrincipalStore()

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
function createMessageMenu(item: ChatBubbleItem, role: string): MenuItemType[] {
  const data = item.data as UserChatMessageResponseBody
  const items: MenuItemType[] = []
  if (getEnumValue(data?.undo) === 0) {

    items.push({
      key: 'reference',
      label: globalProperties.$t('chat.view.reference'),
      icon: createIcon('loncra-text-quote', 'text-lg'),
    })

    if (role === CHAT_BUBBLE_TYPE.USER && globalProperties.$dayjs().isBefore(globalProperties.$dayjs(item?.data?.undoableTime))) {
      const disabled = ref<boolean>(false)
      const timer = h(
        StatisticTimer,
        {
          classes:{
            content:'text-DEFAULT text-text-secondary'
          },
          onFinish: () => disabled.value = true,
          type:'countdown',
          value:item?.data?.undoableTime,
          format:globalProperties.$t('chat.view.undo.countdown')
        }
      )
      const label = h(
        Space,
        {},
        [
          globalProperties.$t('chat.view.undo.action'),
          timer
        ]
      )
      items.push({
        key: 'undo',
        label: label,
        icon: createIcon('loncra-undo', 'text-lg'),
        danger: true,
        disabled:disabled.value
      })
    }
  }

  return items
}

function onMessageMenuClick(e: { key: string }, item: ChatBubbleItem) {
  const data = item.data as UserChatMessageResponseBody
  if (e.key === 'reference') {
    addRefMessage(data)
  }
  else if (e.key === 'undo') {
    onUndoMessage(data)
  }
}

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
      <template #contentRender="{ item, role, content }">
        <a-dropdown
          v-if="item.data && [CHAT_BUBBLE_TYPE.USER, CHAT_BUBBLE_TYPE.AI].includes(role)"
          :menu="{ items: createMessageMenu(item, role) }"
          :trigger="['contextmenu']"
          @menuClick="onMessageMenuClick($event, item)"
        >
          <div class="cursor-default">
            <l-chat-message-bubble-content
              :content="content"
              @jump-to-reference="(body) => jumpToMessage(String(body.id))"
            >
              <template #undo="{text}">
                <a-space>
                  <a-typography-text delete type="secondary">
                    <template v-if="principalStore.isCurrentPrincipal(item.data.principal)">
                      {{globalProperties.$t('chat.view.selfUndo')}}
                    </template>
                    <template v-else>
                      {{text}}
                    </template>
                  </a-typography-text>

                  <a-typography-link v-if="principalStore.isCurrentPrincipal(item.data.principal)" href="javascript:;" @click="reedit(item.data)">
                    {{globalProperties.$t('chat.view.reedit')}}
                  </a-typography-link>
                </a-space>
              </template>
            </l-chat-message-bubble-content>
          </div>
        </a-dropdown>
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

