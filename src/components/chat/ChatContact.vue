<script setup lang="ts">

import {AttachmentService} from "@/apis";
import type {
  RestResult,
  UserChatConversationResponseBody
} from "@/types/apis";
import type {ConversationItemType, ItemType} from "@antdv-next/x/dist/conversations/interface";
import {ChatMessageService} from "@/apis/message-server/chat/chatMessageService.ts";
import {Conversations as AxConversations,} from '@antdv-next/x'
import type {ContactItem} from "@/types/composables";

defineOptions({
  name: 'LChatContact',
})

const dataSource = defineModel<ContactItem[]>('dataSource', {default:() => []})
const loading = defineModel<boolean>('loading', {default:() => false})

const emit = defineEmits<{
  selected: [body: UserChatConversationResponseBody]
}>()

async function onContactActiveChange(value: string, item: ItemType | undefined) {
  if (!item || !(item as ConversationItemType)) {
    return;
  }
  const conversationItem = (item as ConversationItemType)
  loading.value = true
  try {
    const result: RestResult<UserChatConversationResponseBody> = await ChatMessageService.createConversation(
      {
        id: undefined,
        version: undefined
      },
      [conversationItem?.data?.systemName]
    )
    if (!result.data) {
      return;
    }
    const body: UserChatConversationResponseBody = result.data;
    emit("selected", body)
  } finally {
    loading.value = false
  }

}
</script>

<template>:
  <a-flex vertical class="h-full min-h-0 overflow-hidden" >
    <ax-conversations
      :classes="{item:'chat-conversations-item p-xs! h-auto! min-h-auto! rounded-none!'}"
      :items="(dataSource || [])"
      :onActiveChange="onContactActiveChange"
      v-if="dataSource.length > 0"
      groupable
      class="min-h-0 size-full flex-[1_1_0] p-0! gap-0!">
      <template #iconRender="{ item }">
        <a-avatar
          :src="item?.data?.avatar ? AttachmentService.query(item?.data?.avatar.bucketName, item?.data?.avatar.objectName) : undefined"
          size="large"
        >
          {{ item.label.substring(0, 1) }}
        </a-avatar>
      </template>
      <template #labelRender="{item}">
        <a-flex vertical>
          <a-typography-text ellipsis class="flex-1">
            {{ item?.label }}
          </a-typography-text>
          <a-typography-text ellipsis type="secondary">
            {{ item?.data?.phoneNumber || item?.data?.email || ' ' }}
          </a-typography-text>
        </a-flex>
      </template>
    </ax-conversations>
    <a-flex v-else justify="center" align="center" class="size-full">
      <a-empty/>
    </a-flex>
  </a-flex>
</template>
