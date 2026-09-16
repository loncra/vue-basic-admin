<script setup lang="ts">

import type {UserChatConversationResponseBody} from "@/types/apis";
import type {RestResult} from "@loncra/client/commons";
import type {PlatformUser} from "@loncra/client/auth";
import {ChatMessageService} from "@loncra/client/message";
import type {SystemUserContactItem} from '@loncra/antdv-pro';
import {SystemUserPanel as LSystemUserPanel} from '@loncra/antdv-pro';

defineOptions({
  name: 'LChatContact',
})

const dataSource = defineModel<SystemUserContactItem[]>('dataSource', {default:() => []})
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
