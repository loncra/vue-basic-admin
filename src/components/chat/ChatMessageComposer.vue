<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {Sender as AxSender} from '@antdv-next/x'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {ChatMessageContent} from '@/types/apis/message-server/chatDomain'
import {CHAT_SENDER_SLOT_CONFIG, useChatComposer} from '@/composables/chat/useChatComposer.ts'

const emit = defineEmits<{
  submit: [content: ChatMessageContent]
}>()

const senderRef = ref<SenderRef>()
const {
  sending,
  uploading,
  bindSenderRef,
  touchSlots,
  insertMediaFiles,
  buildMessageContent,
  reset,
  canSend,
} = useChatComposer()

onMounted(() => {
  if (senderRef.value) bindSenderRef(senderRef.value)
})

function onPasteFiles(files: FileList) {
  if (!senderRef.value) return
  bindSenderRef(senderRef.value)
  insertMediaFiles(senderRef.value, files)
}

async function handleSubmit(_message: string, slotConfig?: SlotConfigType[]) {
  if (!senderRef.value || !canSend(senderRef.value)) return
  sending.value = true
  try {
    const content = await buildMessageContent(senderRef.value, slotConfig)
    if (!content) return
    emit('submit', content)
    reset(senderRef.value)
  } finally {
    sending.value = false
  }
}

function handleClear() {
  if (!senderRef.value) {
    return
  }
  reset(senderRef.value)
}
</script>

<template>
  <ax-sender
    ref="senderRef"
    :slot-config="CHAT_SENDER_SLOT_CONFIG"
    placeholder="输入消息，可粘贴图片/视频/文件"
    :suffix="false"
    :auto-size="{ maxRows: 6 }"
    :loading="uploading || sending"
    :class-names="{ input: 'chat-sender-input' }"
    @paste-file="onPasteFiles"
    @change="touchSlots"
    @submit="handleSubmit"
  >
    <template #footer="{ components }">
      <a-flex justify="flex-end" align="center" gap="small">
        <component :is="components.ClearButton" @click="handleClear" />
        <component
          :is="uploading || sending ? components.LoadingButton : components.SendButton"
          type="primary"
          :disabled="!senderRef || !canSend(senderRef)"
        />
      </a-flex>
    </template>
  </ax-sender>
</template>
