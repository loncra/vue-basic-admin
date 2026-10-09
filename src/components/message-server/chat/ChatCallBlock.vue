<script setup lang="ts">
import type {CallBlock} from '@loncra/chat-core'
import {
  MESSAGE_SERVER_CHAT_CALL_SCENE,
  MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS,
} from '@loncra/client/message'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {useChatCallModalExpose} from '@/composables/message-server/chat'
import {getCallIcon, getParticipantBadgeStatus} from '@/utils/chatCallUtils.ts'

defineOptions({
  name: 'LChatCallBlock',
})

defineProps<{
  block: CallBlock
}>()

const principalStore = usePrincipalStore()
const chatCallModalExpose = useChatCallModalExpose()
</script>

<template>
  <a-space>
    <a-space align="center">
      <a-badge :status="getParticipantBadgeStatus(block.status)" />
      <icon-font :type="getCallIcon(block.value)" />
      <span>{{ getEnumName(block.status) }}</span>
    </a-space>
    <component
      v-if="getEnumValue(block.status) === MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.INITIATING && block.caller !== principalStore.state.name && getEnumValue(block.scene) === MESSAGE_SERVER_CHAT_CALL_SCENE.PRIVATE"
      :is="chatCallModalExpose.createChatCallAction(block.userChatCallId, chatCallModalExpose.acceptCallByChatCallId, chatCallModalExpose.rejectedCallByChatCallId)"
    />
  </a-space>
</template>
