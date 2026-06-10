<script setup lang="ts">

import type {
  ContactItem,
  PlatformUser,
  RestResult,
  UserChatConversationResponseBody
} from "@/types/apis";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.js";
import LSystemUserPanel from "@/components/basic/SystemUserPanel.vue";

defineOptions({
  name: 'LChatContact',
})

const dataSource = defineModel<ContactItem[]>('dataSource', {default:() => []})
const loading = defineModel<boolean>('loading', {default:() => false})

const emit = defineEmits<{
  selected: [body: UserChatConversationResponseBody]
}>()

async function onContactSelected(data:PlatformUser) {
  loading.value = true
  try {
    const result: RestResult<UserChatConversationResponseBody> = await ChatMessageService.createConversation(
      {
        id: undefined,
        version: undefined
      },
      [data.systemName]
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

<template>
  <a-flex vertical class="h-full min-h-0 overflow-hidden" >
    <l-system-user-panel
      :selected="false"
      hide-search
      hide-select-panel
      @selected="onContactSelected"
      v-model:data-source="dataSource"
      v-if="dataSource.length > 0"
    />
    <a-flex v-else justify="center" align="center" class="size-full">
      <a-empty/>
    </a-flex>
  </a-flex>
</template>
