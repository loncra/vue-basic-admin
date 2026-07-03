<script setup lang="ts">
import type {ChatContentBlock} from '@/types/composables'
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import type {UserChatMessageResponseBody} from "@/types/apis";
import LChatMessageReference from "@/components/chat/ChatMessageReference.vue";
import {useSlots} from "vue";
import {getEnumName, getEnumValue} from "@/utils";
import {
  createChatCallAction,
  getCallIcon,
  getParticipantBadgeStatus
} from "@/utils/chatCallUtils.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useChatCallModelExpose} from "@/composables";

defineOptions({
  name: 'LChatMessageBubbleContent',
})

defineProps<{
  content: ChatContentBlock[]
}>()


const principalStore = usePrincipalStore()

const chatCallModelExpose = useChatCallModelExpose()

const slots = useSlots()

const emit = defineEmits<{
  jumpToReference: [message: UserChatMessageResponseBody],
}>()

</script>

<template>

  <template v-for="(block, index) in content" :key="index">
    <span
      v-if="block.type === 'text'"
      class="whitespace-pre-wrap wrap-break-word"
    >{{ block.value }}
    </span>
    <div v-else-if="block.type === 'custom' && block.slotKind === 'files'">
      <l-attachment-upload
        :show-filename="false"
        preview
        v-model:value="block.files" />
    </div>
    <a-tag variant="outlined" v-else-if="block.type === 'custom' && block.slotKind === 'instruction'">
      <template #icon v-if="block.prefix === '@'">
        <icon-font type="loncra-at-sign" />
      </template>
      {{ block.value.value }}
    </a-tag>
    <a-space v-else-if="block.type === 'custom' && block.slotKind === 'call'">
      <icon-font :type="getCallIcon(block.value)" />
      <a-badge :status="getParticipantBadgeStatus(block.status)" :text="getEnumName(block.status)" />
      <component
        v-if="getEnumValue(block.status) === 10 && block.caller !== principalStore.state.name && getEnumValue(block.scene) === 10"
        :is="createChatCallAction(block.userChatCallId, chatCallModelExpose.acceptCallByChatCallId, chatCallModelExpose.rejectedCallByChatCallId)"
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
</template>
