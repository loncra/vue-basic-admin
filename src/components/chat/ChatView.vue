<script setup lang="ts">

import LChatMessageSender from "@/components/chat/ChatMessageSender.vue";
import type {ChatContentBlock, ConversationActiveProps} from "@/types/composables";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  ref
} from "vue";
import type {ConversationItemType} from "@antdv-next/x/dist/conversations/interface";
import type {
  RestResult,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from "@/types/apis";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.js";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {useSocketStore} from "@/stores/socketStore.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {CHAT_BUBBLE_TYPE, SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import LChatBubbleList from "@/components/chat/ChatBubbleList.vue";

defineOptions({
  name: 'LChatView',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const socketStore = useSocketStore()
const chatBubbleList = ref<InstanceType<typeof LChatBubbleList>>()
const senderRef = ref<InstanceType<typeof LChatMessageSender>>()
const socketListener = ref<((() => void) | undefined)[]>([])
const refMessages = ref<UserChatMessageResponseBody[]>([])

const conversation = defineModel<ConversationActiveProps>("conversation", {default:() => {}})

const emit = defineEmits<{
  send: [entity: UserChatMessageEntity],
  loadPage: [tag:'next' | 'previous', scrollBox: HTMLElement],
  reloadLastPage:[]
}>()


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
    chatBubbleList.value?.scrollTo({ top: "bottom", behavior: "smooth" });
  } finally {
    conversation.value.sending = false
  }
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
  bubble.data.metadata = {oldContent:bubble.data.content}
  bubble.data.content = undoContent
  bubble.content = undoContent
}

function onReedit(content:ChatContentBlock[]) {
  if (!senderRef.value || !conversation.value?.item?.data) {
    return
  }
  conversation.value.item.data.draft = senderRef.value.convertContentBlockToSlotConfig(content)
}

function onReferenceMessage(message:UserChatMessageResponseBody) {
  if (refMessages.value.some(r => r.id === message.id)) {
    return
  }

  refMessages.value.push(message)
}

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
  socketListener.value.forEach(f => f?.())
});

defineExpose({
  getScrollBox: () => chatBubbleList.value?.getScrollBox(),
  jumpToMessage:(
    key: string,
    flashPending: boolean = true,
    block:ScrollLogicalPosition = "nearest",
    behavior:ScrollBehavior = "auto",
  ) => chatBubbleList.value?.jumpToMessage(key, flashPending,block,behavior),
  scrollTo: (options: {
    key?: string | number;
    top?: number | "bottom" | "top";
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
  }) => chatBubbleList.value?.scrollTo(options),
  getSenderSlotConfigValue:() => senderRef?.value?.getSlotConfigValue() || []
})
</script>

<template>
  <a-flex
    vertical
    flex="1"
    class="h-full min-h-0 overflow-hidden"
  >
    <l-chat-bubble-list
      @reload-last-page="emit('reloadLastPage')"
      @load-page="(tag:'next' | 'previous', scrollBox: HTMLElement) => emit('loadPage', tag, scrollBox)"
      @reedit="onReedit"
      @reference-message="onReferenceMessage"
      ref="chatBubbleList"
      :conversation="conversation"
    >
      <template #bubbleListAfter v-if="$slots.bubbleListAfter">
        <slot name="bubbleListAfter" />
      </template>
    </l-chat-bubble-list>
    <div class="shrink-0 p-sm border-t border-t-border-secondary">
      <l-chat-message-sender
        ref="senderRef"
        v-if="conversation?.item?.data"
        :slot-config="conversation.item.data.draft"
        v-model:ref-messages="refMessages"
        :upload-options="{param:{prefix:'user_chat_room/' + conversation.item.data.room.id}}"
        :placeholder="placeholderText"
        :disabled="getEnumValue(conversation.item.data.status) !== 10"
        :sending="conversation.sending"
        @jump-to-reference="(body) => chatBubbleList?.jumpToMessage(String(body.id))"
        @submit="onSendMessage"
      />
    </div>
  </a-flex>

</template>
