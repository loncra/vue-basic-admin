<script setup lang="ts">

import type {BubbleItemType, BubbleListRef, RoleType} from "@antdv-next/x/dist/bubble/interface";
import LChatMessageSender from "@/components/chat/ChatMessageSender.vue";
import type {ChatBubbleItem, ChatContentBlock, ConversationActiveProps} from "@/types/composables";
import {AuthServerService} from "@/apis";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch
} from "vue";
import ChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {ConversationItemType} from "@antdv-next/x/dist/conversations/interface";
import type {
  RestResult,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from "@/types/apis";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.js";
import {BubbleList as AxBubbleList} from "@antdv-next/x";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {useSocketStore} from "@/stores/socketStore.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {CHAT_BUBBLE_TYPE, SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import LChatMessageReadTable from "@/components/chat/ChatMessageReadTable.vue";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {throttle} from 'lodash-es';
import useApp from "antdv-next/dist/app/useApp";
import LUserAvatar from "@/components/basic/UserAvatar.vue";

defineOptions({
  name: 'LChatView',
})

const props = withDefaults(
  defineProps<{
    topThreshold?:number,
    scrollToBottomThreshold?: number,
    throttleCollectVisibleUnreadWait?:number
    throttleOnScrollWait?:number
  }>(),
  {
    throttleCollectVisibleUnreadWait:500,
    throttleOnScrollWait:300,
    topThreshold:250,
    scrollToBottomThreshold:100
  }
)

const {message,modal} = useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()
const socketStore = useSocketStore()
const messageServerStore = useMessageServerStore()
const bubbleListRef = ref<BubbleListRef>()
const showScrollToBottom = ref<boolean>(false)
const senderRef = ref<InstanceType<typeof LChatMessageSender>>()
const socketListener = ref<((() => void) | undefined)[]>([])
const refMessages = ref<UserChatMessageResponseBody[]>([])

const readingSet = new Set<number>();
const sentIds = new Set<number>();
let readProcessing = false;

const TIME_DIVIDER_GAP_MS = 5 * 60 * 1000

const conversation = defineModel<ConversationActiveProps>("conversation", {default:{}})
const emit = defineEmits<{
  send: [entity: UserChatMessageEntity],
  loadPage: [tag:'next' | 'previous', scrollBox: HTMLElement],
}>()

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

function getMessageTime(item: ChatBubbleItem): number {
  return item.data?.creationTime ?? 0
}

function buildBubbleListWithDividers(messages: ChatBubbleItem[]): BubbleItemType[] {
  // 升序：[旧 → 新]，配合 column-reverse 贴底
  const sorted = [...messages].sort((a, b) => getMessageTime(a) - getMessageTime(b))
  const result: BubbleItemType[] = []
  let lastDividerTime = 0
  for (const msg of sorted) {
    const msgTime = getMessageTime(msg)
    const needDivider = result.length === 0 || (msgTime > 0 && msgTime - lastDividerTime >= TIME_DIVIDER_GAP_MS)
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

const bubbleListItems = computed(() =>
  buildBubbleListWithDividers(conversation.value.bubbleList ?? []),
)

const placeholderText = computed(() => {
  if (getEnumValue(conversation.value?.item?.data?.status) === 20) {
    return globalProperties.$t('chat.view.placeholder.exitRoom')
  } else if (getEnumValue(conversation.value?.item?.data?.status) === 25) {
    return globalProperties.$t('chat.view.placeholder.roomRemove')
  } else if (getEnumValue(conversation.value?.item?.data?.status) === 30) {
    return globalProperties.$t('chat.view.placeholder.disbandRoom')
  } else {
    return globalProperties.$t('chat.view.placeholder.text')
  }
})

function renderBubbleContent(content: ChatContentBlock[]) {
  return h(
    ChatMessageBubbleContent,
    {
      content: content,
      onJumpToReference:jumpToMessage
    }
  )
}
async function onSendMessage(content: ChatContentBlock[]) {
  const conversationItem = conversation.value.item as ConversationItemType | undefined
  const body = conversationItem?.data as UserChatConversationResponseBody | undefined
  const chatRoomId = body?.room?.id
  if (!chatRoomId || !conversationItem) {
    return
  }
  conversation.value.sending = true
  try {
    const result = await ChatMessageService.send(content, String(chatRoomId))
    if (!result.data) {
      return
    }
    const body: UserChatMessageResponseBody = result.data
    ChatMessageService.addBubbleListMessage(body, CHAT_BUBBLE_TYPE.USER, conversation.value.bubbleList)
    senderRef.value?.clear()
    emit("send", body)
    await nextTick()
    bubbleListRef.value?.scrollTo({ top: "bottom", behavior: "smooth" });
  } finally {
    conversation.value.sending = false
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

// 节流后的处理函数，props.throttleCollectVisibleUnreadWait 内最多触发一次
const handleScrollRead = throttle(collectVisibleUnread, props.throttleCollectVisibleUnreadWait);
// 节流后的处理函数，props.throttleCollectVisibleUnreadWait 内最多触发一次
const handleThrottleBubbleScroll = throttle(throttleBubbleScroll, props.throttleOnScrollWait, { leading: true, trailing: false });

function throttleBubbleScroll(event: Event) {
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

function onBubbleScroll(event: Event) {
  const scrollBox = event.target as HTMLElement
  showScrollToBottom.value = scrollBox.scrollTop <= -props.scrollToBottomThreshold
  tryFlashPendingItems(scrollBox)

  handleThrottleBubbleScroll(event)
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

function onChatMessageReadReceived(result: RestResult<UserChatMessageResponseBody>) {
  if (!result.data) {
    return
  }
  const index = conversation.value.bubbleList.findIndex(b => b?.data?.id === result?.data?.id)
  if (index < 0) {
    return
  }
  const bubble = conversation.value.bubbleList[index]
  if (!bubble) {
    return
  }
  bubble.data = result.data
}

function onChatMessageUndo(result: RestResult<UserChatMessageEntity>) {
  if (!result.data) {
    return
  }

  const index = conversation.value.bubbleList.findIndex(b => b?.data?.id === result?.data?.id)
  if (index < 0) {
    return
  }
  const bubble = conversation.value.bubbleList[index]
  if (!bubble || !bubble.data) {
    return
  }
  bubble.data.undo = result.data.undo
  bubble.data.undoTime = result.data.undoTime
  const undoContent: ChatContentBlock[] = [{
    type: 'custom',
    slotKind: 'undo',
    value: globalProperties.$t('chat.view.undo.messageValue'),
    tooltip:globalProperties.$t('chat.view.undo.time', {time:':' + globalProperties.$dayjs(bubble.data.undoTime).fromNow()})
  }]
  bubble.data.content = undoContent
  bubble.content = undoContent
}

function addRefMessage(item:UserChatMessageResponseBody) {
  if (!item) {
    return
  }
  if (refMessages.value.some(r => r.id === item.id)) {
    return
  }

  refMessages.value.push(item)
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

function jumpToMessage(
  body: UserChatMessageResponseBody,
  flashPending: boolean = true,
  behavior:ScrollBehavior = 'smooth',
  block:ScrollLogicalPosition = 'start'
) {

  const bubble = conversation.value.bubbleList.find(b => b.data?.id === body.id)

  if (!bubble) {
    return
  }

  bubbleListRef.value?.scrollTo({
    key: String(body.id),
    behavior: behavior,
    block: block,
  })
  if (!flashPending) {
    return
  }

  if (!bubbleListRef.value) {
    return ;
  }
  bubble.flashPending = flashPending
  nextTick(() => tryFlashPendingItems(bubbleListRef.value?.scrollBoxNativeElement))
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
  refMessages.value = []
})

function mounted() {
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ,
    (payload) => onChatMessageReadReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload))
  ))
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE_UNDO,
    (payload) => onChatMessageUndo(parseSocketRestPayload<UserChatMessageEntity>(payload))
  ))
}

onMounted(mounted)

onUnmounted(() => {
  handleScrollRead.cancel()
  socketListener.value.forEach(f => f?.())
});

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
  <a-flex
    vertical
    flex="1"
    class="h-full min-h-0 overflow-hidden"
  >
    <a-flex class="h-full min-h-0 overflow-hidden relative flex-[1_1_0]">
      <ax-bubble-list
        auto-scroll
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
            <a-button :disabled="getEnumValue(item.data.undo) === 1" size="small" type="text" @click="addRefMessage(item.data)">
              <icon-font type="loncra-text-quote"/>
            </a-button>
            <a-button size="small" :disabled="getEnumValue(item.data.undo) === 1" type="text" danger @click="onUndoMessage(item.data)" v-if="role === CHAT_BUBBLE_TYPE.USER">
              <icon-font type="loncra-undo"/>
            </a-button>
          </a-flex>
        </template>
      </ax-bubble-list>
      <slot name="bubbleListAfter"></slot>
      <a-button
        shape="circle"
        v-if="showScrollToBottom"
        @click="bubbleListRef?.scrollTo({ top: 'bottom' });"
        class="shadow-card absolute bottom-0 mb-sm left-1/2 -translate-x-1/2"
      >
        <template #icon>
          <icon-font type="loncra-hard-drive-download"/>
        </template>
      </a-button>
    </a-flex>
    <div class="shrink-0 p-sm border-t border-t-border-secondary">
      <l-chat-message-sender
        ref="senderRef"
        :upload-options="{param:{prefix:'user_chat_room/' + conversation.item.data.room.id}}"
        v-if="conversation?.item?.data"
        v-model:ref-messages="refMessages"
        :placeholder="placeholderText"
        :disabled="getEnumValue(conversation.item.data.status) !== 10"
        :sending="conversation.sending"
        @jump-to-reference="(body) => jumpToMessage(body)"
        @submit="onSendMessage"
      />
    </div>
  </a-flex>

</template>
