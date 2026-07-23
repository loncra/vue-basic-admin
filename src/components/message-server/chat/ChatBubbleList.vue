<script setup lang="ts">
import {getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {CHAT_BUBBLE_TYPE} from '@/constants'
import {AuthServerService} from '@/apis'
import LUserAvatar from '@/components/basic/UserAvatar.vue'
import LChatMessageReadTable from '@/components/message-server/chat/ChatMessageReadTable.vue'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {ChatContentBlock} from '@/types/composables'
import type {UserChatMessageResponseBody} from '@/types/apis'
import {useChatBubbleList, useChatContext} from '@/composables/message-server/chat'
import LChatMessageBubbleContent
  from '@/components/message-server/chat/ChatMessageBubbleContent.vue'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import LBubbleList from '@/components/basic/chat/BubbleList.vue'

defineOptions({
  name: 'LChatBubbleList',
})

const TIME_DIVIDER_GAP_MS = 5 * 60 * 1000
const ROOM_TYPE_GROUP = 10
const ROOM_TYPE_PRIVATE = 20

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(
  defineProps<{
    scrollToBottomThreshold?: number
    throttleOnScrollWait?: number
    throttleCollectVisibleUnreadWait?: number
    topThreshold?: number
    timeDividerGap?: number
  }>(),
  {
    throttleCollectVisibleUnreadWait: 500,
    throttleOnScrollWait: 300,
    topThreshold: 250,
    scrollToBottomThreshold: 100,
    timeDividerGap: TIME_DIVIDER_GAP_MS,
  },
)

const emit = defineEmits<{
  reedit: [content: ChatContentBlock[]]
  referenceMessage: [message: UserChatMessageResponseBody]
}>()

const {conversationActive: conversation, loader} = useChatContext()
const principalStore = usePrincipalStore()
const bubbleListRef = ref<InstanceType<typeof LBubbleList>>()

const {
  session,
  listProps,
  bubbleListItems,
  bubbleListRole,
  onVisibleItems,
  reedit,
  createMessageMenu,
  onMessageMenuClick,
  onLoadPage,
  onReloadLastPage,
} = useChatBubbleList(
  conversation,
  {
    scrollToBottomThreshold: props.scrollToBottomThreshold,
    throttleOnScrollWait: props.throttleOnScrollWait,
    throttleCollectVisibleWait: props.throttleCollectVisibleUnreadWait,
    topThreshold: props.topThreshold,
    timeDividerGap: props.timeDividerGap,
  },
  {
    onLoadPage: (tag) => loader.loadMore(tag),
    onReloadLastPage: () => {
      const item = conversation.value.item
      if (item) {
        loader.switchConversation(item, undefined, true)
      }
    },
    onReedit: (content) => emit('reedit', content),
    onReferenceMessage: (message) => emit('referenceMessage', message),
  },
)

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
  <l-bubble-list
    ref="bubbleListRef"
    :session="session"
    :items="bubbleListItems"
    collect-visible
    :scroll-to-bottom-threshold="listProps.scrollToBottomThreshold"
    :throttle-on-scroll-wait="listProps.throttleOnScrollWait"
    :throttle-collect-visible-wait="listProps.throttleCollectVisibleWait"
    :top-threshold="listProps.topThreshold"
    :role="bubbleListRole"
    @load-page="onLoadPage"
    @reload-last-page="onReloadLastPage"
    @visible-items="onVisibleItems"
  >
    <template #extra="{ item }">
      <a-flex class="h-full" justify="end" align="end">
        <a-tooltip
          v-if="
            getEnumValue(conversation.item?.data?.room?.type) === ROOM_TYPE_PRIVATE &&
            item.role === CHAT_BUBBLE_TYPE.USER
          "
          :title="
            item.data.readableCount === 1
              ? globalProperties.$t('common.read.readable')
              : globalProperties.$t('common.read.unreadable')
          "
        >
          <a-typography-text :type="item.data.readableCount === 1 ? 'secondary' : 'success'">
            <icon-font
              class="icon"
              :type="item.data.readableCount === 1 ? 'loncra-eye-off' : 'loncra-eye'"
            />
          </a-typography-text>
        </a-tooltip>
        <a-popover
          v-else-if="
            getEnumValue(conversation.item?.data?.room?.type) === ROOM_TYPE_GROUP && item.data
          "
          :placement="item.role === CHAT_BUBBLE_TYPE.USER ? 'left' : 'right'"
          trigger="click"
        >
          <template #content>
            <l-chat-message-read-table :message-id="item.data.id" />
          </template>

          <a-button
            :color="
              Math.abs(item.data.readableCount - item.data.readCount) < item.data.readCount
                ? undefined
                : 'lime'
            "
            size="small"
            :variant="
              Math.abs(item.data.readableCount - item.data.readCount) >= item.data.readCount
                ? 'filled'
                : undefined
            "
            type="dashed"
          >
            <a-space
              v-if="
                Math.abs(item.data.readableCount - item.data.readCount) < item.data.readCount
              "
            >
              <a-badge status="processing" />
              {{ Math.abs(item.data.readableCount - item.data.readCount) }} /
              {{ item.data.readCount }}
            </a-space>
            <template
              v-if="
                Math.abs(item.data.readableCount - item.data.readCount) >= item.data.readCount
              "
              #icon
            >
              <icon-font type="loncra-list-checks" />
            </template>
          </a-button>
        </a-popover>
      </a-flex>
    </template>
    <template #avatar="{ item }">
      <l-user-avatar size="large" :user="item.data?.participant?.metadata?.details" />
    </template>
    <template #header="{ item }">
      <a-typography-text v-if="item.role === CHAT_BUBBLE_TYPE.AI">
        <template v-if="getEnumValue(conversation.item?.data?.room?.type) === ROOM_TYPE_GROUP">
          {{
            AuthServerService.getPrincipalNameByUserDetails(item.data.participant.metadata.details)
          }}
        </template>
        <template v-if="getEnumValue(conversation.item?.data?.room?.type) === ROOM_TYPE_PRIVATE">
          {{ conversation.item?.label || globalProperties.$t('common.unname') }}
        </template>
      </a-typography-text>
      <a-typography-text v-else type="secondary">
        {{ globalProperties.$t('common.me') }}
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
            @jump-to-reference="(body) => bubbleListRef?.jumpToMessage(String(body.id))"
          >
            <template #undo="{ text }">
              <a-space>
                <a-typography-text delete type="secondary">
                  <template v-if="principalStore.isCurrentPrincipal(item.data.principal)">
                    {{ globalProperties.$t('chat.view.selfUndo') }}
                  </template>
                  <template v-else>
                    {{ text }}
                  </template>
                </a-typography-text>

                <a-typography-link
                  v-if="principalStore.isCurrentPrincipal(item.data.principal)"
                  href="javascript:;"
                  @click="reedit(item.data)"
                >
                  {{ globalProperties.$t('chat.view.reedit') }}
                </a-typography-link>
              </a-space>
            </template>
          </l-chat-message-bubble-content>
        </div>
      </a-dropdown>
    </template>
    <template v-if="$slots.bubbleListAfter" #bubbleListAfter>
      <slot name="bubbleListAfter" />
    </template>
  </l-bubble-list>
</template>
