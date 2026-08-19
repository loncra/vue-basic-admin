<script setup lang="ts">
import type {ChatContentBlock} from '@/types/composables'
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import type {UserChatMessageResponseBody} from "@/types/apis";
import LChatMessageReference from "@/components/message-server/chat/ChatMessageReference.vue";
import {useSlots} from "vue";
import {getEnumName, getEnumValue} from "@/utils";
import {getCallIcon, getParticipantBadgeStatus} from "@/utils/chatCallUtils.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useChatCallModalExpose} from "@/composables";
import LSenderSoldBubbleContent from "@/components/basic/chat/SenderSlotBubbleContent.vue";
import {CHAT_CALL_SCENE, USER_CHAT_CALL_PARTICIPANT_STATUS} from "@/constants";

defineOptions({
  name: 'LChatMessageBubbleContent',
})

defineProps<{
  content: ChatContentBlock[]
}>()

const principalStore = usePrincipalStore()

const chatCallModalExpose = useChatCallModalExpose()

const slots = useSlots()

const emit = defineEmits<{
  jumpToReference: [message: UserChatMessageResponseBody],
}>()

</script>

<template>
  <l-sender-sold-bubble-content :content="content">
    <template #renderBlock="{block:block}">
      <div v-if="block.type === 'custom' && block.slotKind === 'files'">
        <l-attachment-upload
          :show-filename="false"
          preview
          v-model:value="block.files"
        />
      </div>

      <a-space v-else-if="block.type === 'custom' && block.slotKind === 'call'">

        <a-space align="center">
          <a-badge :status="getParticipantBadgeStatus(block.status)" />
          <icon-font :type="getCallIcon(block.value)" />
          <span>{{ getEnumName(block.status) }}</span>
        </a-space>
        <component
          v-if="getEnumValue(block.status) === USER_CHAT_CALL_PARTICIPANT_STATUS.INITIATING && block.caller !== principalStore.state.name && getEnumValue(block.scene) === CHAT_CALL_SCENE.PRIVATE"
          :is="chatCallModalExpose.createChatCallAction(block.userChatCallId, chatCallModalExpose.acceptCallByChatCallId, chatCallModalExpose.rejectedCallByChatCallId)"
        >
        </component>
      </a-space>
      <a-tooltip :title="block.tooltip" v-else-if="block.type === 'custom' && block.slotKind === 'undo'">
        <slot v-if="slots.undo" name="undo" :text="block.value"/>
        <a-typography-text v-else delete type="secondary">
          {{block.value}}
        </a-typography-text>
      </a-tooltip>
      <a-flex vertical gap="small" v-else-if="block.type === 'custom' && block.slotKind === 'reference'">
        <l-chat-message-reference
          variant="outlined"
          @click="emit('jumpToReference', r)"
          :message="r"
          :key="r.id"
          v-for="r of block.value"
        />
      </a-flex>
    </template>
  </l-sender-sold-bubble-content>
</template>
