<script setup lang="ts">

import type {BubbleItemType, BubbleListRef, RoleType} from "@antdv-next/x/dist/bubble/interface";
import LChatMessageSender from "@/components/chat/ChatMessageSender.vue";
import type {ChatContentBlock, ConversationActiveProps} from "@/types/composables";
import {AttachmentService} from "@/apis";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref
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
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import LChatMessageReadTable from "@/components/chat/ChatMessageReadTable.vue";

defineOptions({
  name: 'LChatView',
})

const props = withDefaults(
  defineProps<{
    topThreshold?:number
  }>(),
  {
    topThreshold:80
  }
)

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()
const socketStore = useSocketStore()
const bubbleListRef = ref<BubbleListRef>()
const senderRef = ref<InstanceType<typeof LChatMessageSender>>()

const socketListener = ref<((() => void) | undefined)[]>([])

const conversation = defineModel<ConversationActiveProps>("conversation", {default:{}})
const emit = defineEmits<{
  send: [entity: UserChatMessageEntity],
  nextPage: [scrollBox: HTMLElement]
}>()

const bubbleListRole = {
  user: {
    contentRender: renderBubbleContent,
    variant: 'filled',
    placement: 'end',
    shape: 'corner',
    classes: {content: 'bg-primary-bg!'},
  },
  ai: {
    contentRender: renderBubbleContent,
    variant: 'filled',
    placement: 'start',
    shape: 'corner',
  },
  system: {
    variant: 'outlined',
    shape: 'round',
    classes: { content: 'text-text-secondary!' },
    }
} satisfies RoleType


function renderBubbleContent(content: ChatContentBlock[]) {
  return h(ChatMessageBubbleContent, {content: content})
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
    ChatMessageService.addBubbleListMessage(body, 'user', conversation.value.bubbleList)
    senderRef.value?.clear()
    emit("send", body)
    await nextTick()
    bubbleListRef.value?.scrollTo({ top: "bottom", behavior: "smooth" });
  } finally {
    conversation.value.sending = false
  }
}

function isNearOldest(scrollBox: HTMLElement) {
  return scrollBox.scrollHeight + scrollBox.scrollTop <= scrollBox.clientHeight + props.topThreshold
}

function onScroll(event:Event) {
  const scrollBox = event.target as HTMLElement

  if (conversation.value.loading) {
    return
  }
  if (conversation.value.dataSource.last) {
    return
  }

  if (!isNearOldest(scrollBox)) {
    return
  }
  emit("nextPage", scrollBox)
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
  bubble.data = result?.data
}

function mounted() {
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ,
    (payload) => onChatMessageReadReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload))
  ))
}

onMounted(mounted)
onUnmounted(() => socketListener.value.forEach(f => f?.()));
defineExpose({
  getScrollBox: () => bubbleListRef.value?.scrollBoxNativeElement,
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
    <a-flex flex="1" class="h-full min-h-0">
      <a-spin :spinning="conversation.loading" class="size-full-spin">
        <ax-bubble-list
          auto-scroll
          ref="bubbleListRef"
          class="min-h-0 h-full flex flex-[1_1_0]"
          :classes="{scroll:'pl-xs pr-xs'}"
          :items="(conversation.bubbleList as BubbleItemType[])"
          @scroll="onScroll"
          :role="bubbleListRole"
        >
          <template #extra="{item}" >
            <a-flex class="h-full" justify="end" align="end">
              <a-tooltip v-if="getEnumValue(conversation.item?.data?.room?.type) === 20 && item.role === 'user'" :title="item.data.readableCount === 1 ? '未读' :'已读'">
                <a-typography-text :type="item.data.readableCount === 1 ? 'secondary' : 'success'">
                  <icon-font class="icon" :type="item.data.readableCount === 1 ? 'loncra-eye-off' : 'loncra-eye'" />
                </a-typography-text>
              </a-tooltip>
              <a-popover
                :placement="item.role === 'user' ? 'left' : 'right'"
                v-else-if="getEnumValue(conversation.item?.data?.room?.type) === 10 && item.data"
                trigger="click"
              >
                <template #content>
                  <l-chat-message-read-table :message-id="item.data.id" />
                </template>

                <a-button
                  :color="Math.abs(item.data.readableCount - item.data.readCount) < item.data.readCoun ? undefined : 'lime'"
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
            <a-avatar
              :src="AttachmentService.getAvatarUrlIfNotNull(item.data?.participant?.metadata?.details?.avatar)"
              v-if="item.role === 'ai'"
              size="large"
            >
              <template v-if="getEnumValue(conversation.item?.data?.room?.type) === 10">
                {{ (item.data?.participant?.metadata?.details?.realName || item.data?.participant?.metadata?.details.useranme || globalProperties.$t('common.unname')).substring(0,1) }}
              </template>
              <template v-if="getEnumValue(conversation.item?.data?.room?.type) === 10">
                {{ (conversation.item?.label || globalProperties.$t('common.unname')).substring(0,1) }}
              </template>
            </a-avatar>
            <a-avatar
              :src="principalStore.getAvatarUrl()"
              v-else
              size="large"
            >
              {{globalProperties.$t('common.me')}}
            </a-avatar>
          </template>
          <template #header="{ item }">
            <a-typography-text v-if="item.role === 'ai'">
              <template v-if="getEnumValue(conversation.item?.data?.room?.type) === 10">
                {{ item.data?.participant?.metadata?.details?.realName || item.data?.participant?.metadata?.details.useranme }}
              </template>
              <template v-if="getEnumValue(conversation.item?.data?.room?.type) === 20">
                {{ (conversation.item?.label || globalProperties.$t('common.unname'))}}
              </template>
            </a-typography-text>
            <a-typography-text type="secondary" v-else>
              {{globalProperties.$t('common.me')}}
            </a-typography-text>
          </template>
        </ax-bubble-list>
      </a-spin>
    </a-flex>
    <div class="shrink-0 p-sm border-t border-t-border-secondary">
      <l-chat-message-sender :sending="conversation.sending" ref="senderRef" @submit="onSendMessage"/>
    </div>
  </a-flex>

</template>
