<script setup lang="ts">

import type {BubbleItemType, RoleType} from "@antdv-next/x/dist/bubble/interface";
import LChatMessageSender from "@/components/chat/ChatMessageSender.vue";
import type {ChatBubbleItem, ChatContentBlock, ConversationActiveProps} from "@/types/composables";
import {AttachmentService} from "@/apis";
import {type ComponentInternalInstance, getCurrentInstance, h, ref} from "vue";
import ChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {ConversationItemType} from "@antdv-next/x/dist/conversations/interface";
import type {
  FileObject,
  UserChatConversationResponseBody,
  UserChatMessageEntity
} from "@/types/apis";
import {ChatMessageService} from "@/apis/message-server/chat/chatMessageService.ts";
import {BubbleList as AxBubbleList} from "@antdv-next/x";
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LChatView',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()
const senderRef = ref<InstanceType<typeof LChatMessageSender>>()
const conversation = defineModel<ConversationActiveProps>("conversation", {default:{}})
const emit = defineEmits<{
  send: [entity: UserChatMessageEntity]
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
} satisfies RoleType

function getConversationItemAvatar(item: FileObject) {
  return item ? AttachmentService.query(item.bucketName, item.objectName) : ''
}

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
    const body: UserChatMessageEntity = result.data
    addMessage(body, 'user')
    senderRef.value?.clear()
    emit("send", body)
  } finally {
    conversation.value.sending = false
  }
}

function addMessage(body: UserChatMessageEntity, role:ChatBubbleItem["role"]) {
  conversation.value.bubbleList.push({
    key: String(body.id),
    role: role,
    content: body.content,
    data:body
  })
}

defineExpose({
  addMessage
})
</script>

<template>
  <a-flex flex="1" vertical>
    <a-spin :spinning="conversation.loading" class="h-full-spin">
      <ax-bubble-list
        auto-scroll
        class="min-h-0 h-full"
        :classes="{scroll:'pl-xs pr-xs'}"
        :items="(conversation.bubbleList as BubbleItemType[])"
        :role="bubbleListRole"
      >
        <template #extra="{item}" >
          <a-flex class="h-full" justify="end" align="end">
            <a-tag color="lime" v-if="item.role === 'user' && item.data.readableCount === 0" >已读</a-tag>
          </a-flex>
        </template>
        <template #avatar="{ item }">
          <a-avatar
            :src="getConversationItemAvatar(item.data?.participant?.metadata?.details?.avatar)"
            v-if="item.role === 'ai'"
            size="large"
          >
            {{ (item.data?.participant?.metadata?.details?.realName || item.data?.participant?.metadata?.details.useranme || globalProperties.$t('common.unname')).substring(0,1) }}
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
            {{ item.data?.participant?.metadata?.details?.realName || item.data?.participant?.metadata?.details.useranme }}
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

</template>

<style scoped>

</style>
