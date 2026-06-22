<script setup lang="ts">

import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {CHAT_BUBBLE_TYPE} from "@/constants/messageConstant.ts";
import {AuthServerService} from "@/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import LChatMessageReadTable from "@/components/chat/ChatMessageReadTable.vue";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  nextTick,
  onUnmounted,
  ref,
  watch
} from "vue";
import type {BubbleItemType, BubbleListRef, RoleType} from "@antdv-next/x/dist/bubble/interface";
import type {ChatBubbleItem, ChatContentBlock, ConversationActiveProps} from "@/types/composables";
import ChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {BubbleList as AxBubbleList} from "@antdv-next/x";
import {throttle} from "lodash-es";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import type {RestResult, UserChatMessageEntity, UserChatMessageResponseBody} from "@/types/apis";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import useApp from "antdv-next/dist/app/useApp";
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";

defineOptions({
  name: 'LChatBubbleList',
})

const {message,modal} = useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()
const messageServerStore = useMessageServerStore()

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

const showScrollToBottom = ref<boolean>(false)
const bubbleListRef = ref<BubbleListRef>()

const readingSet = new Set<number>();
const sentIds = new Set<number>();
const bubbleListRole = {
  user: {
    contentRender: renderBubbleContent,
    variant: 'filled',
    placement: 'end',
    shape: 'corner',
    classes: {content: 'bg-primary-bg!'},
    footerPlacement:'inner-start',
  },
  ai: {
    contentRender: renderBubbleContent,
    variant: 'filled',
    placement: 'start',
    shape: 'corner',
    footerPlacement:'inner-start',
  },
  system: {
    variant: 'outlined',
    shape: 'round',
    classes: { content: 'text-text-secondary!' },
  },
  divider: {
    dividerProps: {
      plain: true,
      dashed:true,
      size: 'small',
      classes: {
        content: 'text-text-secondary! text-xs! font-normal!',
        root: 'text-text-secondary! text-xs! font-normal! my-xs!',
      },
    }
  },
} as RoleType
let readProcessing = false;

const conversation = defineModel<ConversationActiveProps>("conversation", {default:{}})

const emit = defineEmits<{
  loadPage: [tag:'next' | 'previous', scrollBox: HTMLElement]
  reedit:[content: ChatContentBlock[]]
  referenceMessage:[message:UserChatMessageResponseBody]
  reloadLastPage:[]
}>()

const bubbleListItems = computed(() =>
  buildBubbleListWithDividers(conversation.value.bubbleList ?? []),
)

// 节流后的处理函数，props.throttleCollectVisibleUnreadWait 内最多触发一次
const handleThrottleBubbleScroll = throttle(throttleBubbleScroll, props.throttleOnScrollWait, { leading: true, trailing: false });
// 节流后的处理函数，props.throttleCollectVisibleUnreadWait 内最多触发一次
const handleScrollRead = throttle(collectVisibleUnread, props.throttleCollectVisibleUnreadWait);

function getMessageTime(item: ChatBubbleItem): number {
  return item.data?.creationTime ?? 0
}

function buildBubbleListWithDividers(messages: ChatBubbleItem[]): BubbleItemType[] {
  // 升序：[旧 → 新]，配合 column-reverse 贴底
  const sorted = [...messages.filter(s => !s.hide)].sort((a, b) => getMessageTime(a) - getMessageTime(b))
  const result: BubbleItemType[] = []
  let lastDividerTime = 0
  for (const msg of sorted) {
    const msgTime = getMessageTime(msg)
    const needDivider = result.length === 0 || (msgTime > 0 && msgTime - lastDividerTime >= props.timeDividerGap)
    if (needDivider && msgTime > 0) {
      result.push({
        key: `divider-${String(msg.key)}-${msgTime}`,
        role: 'divider',
        content: globalProperties.$dayjs(msgTime).fromNow(),
      })
      lastDividerTime = msgTime
    }
    result.push({
      ...msg,
      rootClass: 'rounded-lg ' + (msg.flashPending ? 'bg-flash' : ''),
    } as BubbleItemType)
  }
  return result
}

function renderBubbleContent(content: ChatContentBlock[]) {
  return h(
    ChatMessageBubbleContent,
    {
      content: content,
      onJumpToReference: (body) => jumpToMessage(String(body.id))
    }
  )
}

function jumpToBottom(type:'reloadLastPage' | 'bottom') {
  if (type === 'bottom') {
    bubbleListRef.value?.scrollTo({ top: 'bottom' });
  } else {
    emit("reloadLastPage")
  }
}

function jumpToMessage(
  key: string,
  flashPending: boolean = true,
  block:ScrollLogicalPosition = "nearest",
  behavior:ScrollBehavior = "auto",
) {
  if (!bubbleListRef.value || !key) {
    return
  }
  const index = conversation.value.bubbleList.findIndex(b => b.key === key)

  if (index < 0) {
    return
  }

  const bubble = conversation.value.bubbleList[index]
  if (!bubble) {
    return
  }
  bubble.flashPending = flashPending

  try {
    bubbleListRef.value?.scrollTo({
      key: key,
      behavior:behavior,
      block: block,
    })
    if (!flashPending) {
      return
    }
    nextTick(() => tryFlashPendingItems(bubbleListRef.value?.scrollBoxNativeElement))
  } finally {
  }

}

function throttleBubbleScroll(event: Event) {
  if (conversation.value.loadConversationDataLock || conversation.value.loading) {
    return
  }
  const scrollBox = event.target as HTMLElement
  handleScrollRead(scrollBox)
  const { first, last } = conversation.value.dataSource
  // 滚到最上方 → 加载更旧（number++）
  if (!last && isNearOldest(scrollBox)) {
    emit('loadPage', 'next', scrollBox)
  }
  // 滚到最下方 → 加载更新（number--）
  else if (!first && isNearNewest(scrollBox)) {
    emit('loadPage', 'previous', scrollBox)
  }
}
/** column-reverse：是否靠近最旧消息一侧（视觉顶部） */
function isNearOldest(scrollBox: HTMLElement) {
  return scrollBox.scrollHeight + scrollBox.scrollTop
    <= scrollBox.clientHeight + props.topThreshold
}
/** column-reverse：是否靠近最新消息一侧（视觉底部） */
function isNearNewest(scrollBox: HTMLElement) {
  return scrollBox.scrollTop >= -props.topThreshold
}

function isReadableMessage(message: UserChatMessageResponseBody | UserChatMessageEntity) {
  if (!message || getEnumValue(message.type) === 20) {
    return false
  }
  const readable = (message as UserChatMessageResponseBody).readable
  if (readable === undefined) {
    return false
  }
  return getEnumValue(readable) === 1 && message.principal !== principalStore.state.name
}

function collectVisibleUnread(scrollBox: HTMLElement) {
  const items:ChatBubbleItem[] = getVisibleChatBubbleItems(
    scrollBox,
    item => isReadableMessage(item?.data as UserChatMessageResponseBody)
  )
  if (items.length <= 0) {
    return
  }
  for (const data of items.map(i => i.data)) {
    if (!data) {
      continue
    }
    const id = Number(data.id)
    // sentIds 拦截已提交但本地 readable 尚未被 socket 回包更新的消息，避免重复提交
    if (!sentIds.has(id)) {
      readingSet.add(id)
    }

    if (id === conversation.value.dataSource?.metadata?.readableAnchorId) {
      delete conversation.value.dataSource?.metadata?.readableAnchorId
    }

  }
  void flushReadQueue()
}

async function flushReadQueue() {
  if (readProcessing || readingSet.size === 0) {
    return
  }
  readProcessing = true
  try {
    // while 循环：await 期间新收集的 ID 由下一轮批次带走
    while (readingSet.size > 0) {
      const batch = Array.from(readingSet)
      readingSet.clear()
      try {
        await ChatMessageService.readMessage(batch)
        batch.forEach(id => sentIds.add(id))
        await messageServerStore.fetchUnreadQuantity()
      } catch (error) {
        console.error('标记已读失败:', error)
        // 丢弃本批：本地 readable 仍为未读，下次滚动会重新收集，避免服务端故障时无限重试
        break
      }
    }
  } finally {
    readProcessing = false
  }
}

function onBubbleScroll(event: Event) {
  const scrollBox = event.target as HTMLElement
  showScrollToBottom.value = scrollBox.scrollTop <= -props.scrollToBottomThreshold
  tryFlashPendingItems(scrollBox)
  handleThrottleBubbleScroll(event)
}

function getVisibleChatBubbleItems(scrollBox: HTMLElement, filter:(item: ChatBubbleItem) => boolean | undefined) {
  const scrollRect = scrollBox.getBoundingClientRect()
  const content = scrollBox.querySelector('.antd-bubble-list-scroll-content')
  if (!content) {
    return []
  }

  const items: ChatBubbleItem[] = []
  const children = content.children

  for (let i = 0; i < children.length && i < bubbleListItems.value.length; i++) {
    const item = bubbleListItems.value[i]
    if (!item || item.role === 'divider') {
      continue
    }
    if (!filter((item as ChatBubbleItem))) {
      continue
    }
    const element = children[i] as HTMLElement
    const rect = element.getBoundingClientRect()
    if (rect.bottom > scrollRect.top && rect.top < scrollRect.bottom) {
      items.push(item)
    }
  }
  return items
}

function tryFlashPendingItems(scrollBox: HTMLElement | undefined) {
  if (!scrollBox){
    return
  }
  const items = getVisibleChatBubbleItems(scrollBox, item => item.flashPending === true)
  for (const visibleItem of items) {
    const bubble = conversation.value.bubbleList.find(b => String(b.key) === String(visibleItem.key))
    if (!bubble) {
      continue
    }
    nextTick(() => setTimeout(() => bubble.flashPending = false, 2000))
    break
  }
}

function reedit(item:UserChatMessageResponseBody) {
  emit("reedit", item.metadata.oldContent as ChatContentBlock[])
}

function addRefMessage(item:UserChatMessageResponseBody) {
  if (!item) {
    return
  }
  emit("referenceMessage", item)
}

function onUndoMessage(item:UserChatMessageResponseBody) {
  modal.confirm({
    title: globalProperties.$t('chat.view.undo.confirmTitle'),
    content: globalProperties.$t('chat.view.undo.confirmContent'),
    onOk: () => doUndoMessage(Number(item.id))
  })
}

function doUndoMessage(id:number): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const result:RestResult<void> = await ChatMessageService.undoMessage([id])
      message.success(result.message)
      resolve()
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
      reject(error)
    }
  })
}
// 数据变化（首屏加载、切换会话、socket 新消息、历史分页）后检查可见区未读。
// 不能依赖 mounted：挂载时 bubbleList 尚未加载，且切换会话不会重新挂载；
// 贴底收到新消息时 scrollTop 不变，也不会触发 scroll 事件
watch(bubbleListItems, async (items) => {
  if (items.length === 0) {
    return
  }
  await nextTick()
  const scrollBox = bubbleListRef.value?.scrollBoxNativeElement
  if (scrollBox) {
    handleScrollRead(scrollBox)
  }
})

// 切换会话时重置已读队列状态
watch(() => conversation.value.item?.key, () => {
  readingSet.clear()
  sentIds.clear()
  //refMessages.value = []
})

onUnmounted(() => {
  handleScrollRead.cancel()
  handleThrottleBubbleScroll.cancel()
})

defineExpose({
  getScrollBox: () => bubbleListRef.value?.scrollBoxNativeElement,
  jumpToMessage,
  scrollTo: (options: {
    key?: string | number;
    top?: number | "bottom" | "top";
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
  }) => bubbleListRef.value?.scrollTo(options)
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

