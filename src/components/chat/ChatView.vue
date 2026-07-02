<script setup lang="ts">

import LChatMessageSender from "@/components/chat/ChatMessageSender.vue";
import type {ChatContentBlock} from "@/types/composables";
import {type ComponentInternalInstance, computed, getCurrentInstance, nextTick, ref} from "vue";
import type {ConversationItemType} from "@antdv-next/x/dist/conversations/interface";
import type {
  IdValueMetadata,
  RestResult,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody,
  UserChatParticipantEntity
} from "@/types/apis";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.js";
import {addBubbleListMessage, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {useChatContext} from "@/composables/chat";
import {useSocketSubscriptions} from "@/composables/useSocketSubscriptions.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {
  CHAT_BUBBLE_TYPE,
  CHAT_EVERYONE_ID,
  SOCKET_EVENT_TYPE,
  VIDEO_CHAT_CONSTRAINTS
} from "@/constants/messageConstant.ts";
import LChatBubbleList from "@/components/chat/ChatBubbleList.vue";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {AuthServerService} from "@/apis";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import LChatCallButton from "@/components/chat/ChatCallButton.vue";
defineOptions({
  name: 'LChatView',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {conversationActive: conversation, conversations} = useChatContext()
const principalStore = usePrincipalStore()
const {on} = useSocketSubscriptions()

const chatBubbleList = ref<InstanceType<typeof LChatBubbleList>>()
const senderRef = ref<InstanceType<typeof LChatMessageSender>>()
const refMessages = ref<UserChatMessageResponseBody[]>([])
const instructionMap = computed(() => ({
  '@':[
    ...conversation.value
    .participants
    .filter(d => !principalStore.isCurrentPrincipal(d.principal))
    .map(p =>({id:p.principal, value:AuthServerService.getPrincipalNameByUserDetails(p.metadata.details), metadata: p as unknown as Record<string, unknown>})),
    ...[{id:CHAT_EVERYONE_ID,value:globalProperties.$t('chat.everyone')}]
  ]
}))

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
  const data = conversationItem?.data as UserChatConversationResponseBody | undefined
  const userChatRoomId = data?.room?.id
  if (!userChatRoomId || !conversationItem) {
    return
  }
  conversation.value.sending = true
  try {
    const result = await ChatMessageService.send(content, String(userChatRoomId))
    if (!result.data) {
      return
    }
    const messageBody: UserChatMessageResponseBody = result.data
    addBubbleListMessage(messageBody, CHAT_BUBBLE_TYPE.USER, conversation.value.bubbleList)
    senderRef.value?.clear()
    conversations.moveToTopByRoomId(messageBody.userChatRoomId, (c) => (c.lastUserMessage = messageBody))
    await nextTick()
    chatBubbleList.value?.scrollTo({ top: "bottom", behavior: "smooth" });
    if (conversation.value?.item?.data?.draft) {
      conversation.value.item.data.draft = []
    }
  } finally {
    conversation.value.sending = false
  }
}

function isInstructionSlot(slot: SlotConfigType): boolean {
  return slot.type === 'custom' && slot.props?.slotKind === 'instruction'
}
/** 选 @所有人 时：去掉所有单人 @ tag，保留文本/附件等 */
function stripIndividualMentions(slots: SlotConfigType[]): SlotConfigType[] {
  return slots.filter((slot) => {
    if (!isInstructionSlot(slot)) {
      return true
    }
    // 已有 @所有人 也一并去掉，后面只插一个新的
    return false
  })
}

function onSenderInsertInstruction(
  sender:SenderRef,
  block:SlotConfigType
) {
  const props = (block as {
      type:'custom',
      key:string,
      props:{
        slotKind:'instruction',
        defaultValue: IdValueMetadata<string, string>;
        prefix: string;
      }
    }
  ).props
  if (props.prefix === '@' && props.defaultValue.id === CHAT_EVERYONE_ID) {
    const slotConfig = sender.getValue().slotConfig ?? []
    const kept = stripIndividualMentions(slotConfig)
    sender.clear()
    if (kept.length > 0) {
      sender.insert(kept, 'start')
    }
    sender.insert([block, { type: 'text', value: ' ' }], 'end')
    sender.focus({ cursor: 'end' })
  } else {
    // 单人 @：沿用原来的 insert
    sender.insert([block, { type: 'text', value: ' ' }], 'cursor')
  }
}

function onInstructionFilter(keyword:string, dataSource:IdValueMetadata<string, string>[], prefix:string) {
  if (!senderRef.value) {
    return dataSource
  }
  if (prefix === '@') {
    const slotConfig:SlotConfigType[] = senderRef.value.getSlotConfigValue()
    const existIds = slotConfig.filter(s => s.type === 'custom')
      .filter(s => s.props?.slotKind === 'instruction')
      .map(s => s.props?.defaultValue.id)

    if (existIds.includes(CHAT_EVERYONE_ID)) {
      return []
    }

    const notExistDataSource = dataSource
      .filter(s => !existIds.includes(s.id))
    if (notExistDataSource.length === 1 && notExistDataSource.at(-1)?.id === CHAT_EVERYONE_ID) {
      return []
    }
    return [
      ...notExistDataSource.filter(s => s.id === CHAT_EVERYONE_ID).filter(s => keyword === '' ? s : s.value.includes(keyword)),
      ...notExistDataSource
      .filter(s => (s.metadata as unknown as UserChatParticipantEntity)?.metadata?.details)
      .filter(s => keyword === '' ? s : AuthServerService.getPrincipalNameByUserDetails((s.metadata as unknown as UserChatParticipantEntity).metadata.details).includes(keyword))
    ]
  }
  return dataSource
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

async function onChatMessageUndo(result: RestResult<UserChatMessageEntity>) {
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

on(
  SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ,
  (payload) => onChatMessageReadReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload))
)
on(
  SOCKET_EVENT_TYPE.CHAT_MESSAGE_UNDO,
  (payload) => onChatMessageUndo(parseSocketRestPayload<UserChatMessageEntity>(payload))
)

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
      @reedit="onReedit"
      @reference-message="onReferenceMessage"
      ref="chatBubbleList"
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
        :instruction-map="instructionMap"
        :sending="conversation.sending"
        :upload-options="conversation.item.data?.room?.id ? {param:{prefix:'user_chat_room/' + conversation.item.data.room.id}} : undefined"
        :placeholder="placeholderText"
        :disabled="getEnumValue(conversation.item.data.status) !== 10"
        @jump-to-reference="(body) => chatBubbleList?.jumpToMessage(String(body.id))"
        @submit="onSendMessage"
        :sender-insert-instruction="onSenderInsertInstruction"
        :filter-instruction="onInstructionFilter"
      >
        <template #instructionItemRender="{item, prefix}">
          <a-space v-if="prefix === '@'">
            <template v-if="(item.metadata as UserChatParticipantEntity)?.metadata?.details" >
              <l-user-avatar
                :user="(item.metadata as UserChatParticipantEntity).metadata.details"
              />
              <a-typography-text :ellipsis="{tooltip:AuthServerService.getPrincipalNameByUserDetails((item.metadata as  UserChatParticipantEntity).metadata.details)}">
                {{ AuthServerService.getPrincipalNameByUserDetails((item.metadata as  UserChatParticipantEntity).metadata.details) }}
              </a-typography-text>
            </template>
            <template v-else>
              <a-avatar>
                {{item.value.substring(0,1)}}
              </a-avatar>
              <a-typography-text>
                {{ item.value }}
              </a-typography-text>
            </template>
          </a-space>
        </template>
        <template #leftButtonExtra>
          <l-chat-call-button
            :constraints="{
              video:getEnumValue(conversation.item.data.room.type) === 10 ? VIDEO_CHAT_CONSTRAINTS.GROUP : VIDEO_CHAT_CONSTRAINTS.PREVATE,
              voice:{
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            }"
            :participants="conversation.participants"
            :conversation="conversation.item"
            type="text"
          />
        </template>
      </l-chat-message-sender>
    </div>
  </a-flex>

</template>
