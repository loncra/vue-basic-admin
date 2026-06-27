<script setup lang="ts">
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {ChatContentBlock} from "@/types/composables";
import {Sender as AxSender} from '@antdv-next/x'
import type {IdValueMetadata, UserChatMessageResponseBody} from "@/types/apis";
import {useChatMessageSender} from "@/composables/chat";
import LChatMessageReference from "@/components/chat/ChatMessageReference.vue";
import LEmojiButton from "@/components/basic/EmojiButton.vue";
import {toRef, unref} from "vue";
import {useChatMessageSendInstruction} from "@/composables/chat/useChatMessageSendInstruction.ts";

defineOptions({
  name: 'LChatMessageSender',
})

const refMessages = defineModel<UserChatMessageResponseBody[]>("refMessages", {default: () => []})

const props = withDefaults(defineProps<{
  slotConfig?: SlotConfigType[]
  placeholder: string
  sending?:boolean
  uploadOptions?: Record<string, unknown>
  disabled: boolean
  instructionMap?:Record<string, IdValueMetadata<string, string>[]>
}>(), {
  slotConfig: () => [],
  placeholder: '',
  sending:false,
  uploadBucket: 'system.file',
  disabled: false,
  instructionMap: () => ({})
})

const emit = defineEmits<{
  submit: [content: ChatContentBlock[]]
  jumpToReference: [body: UserChatMessageResponseBody]
}>()

const {
  senderRef,
  isSending,
  onPasteFiles,
  handleSubmit,
  onSelectedEmoji,
  clear,
  convertContentBlockToSlotConfig,
  getSlotConfigValue,
} = useChatMessageSender({
  refMessages,
  sending: toRef(props, 'sending'),
  getUploadOptions: () => props.uploadOptions,
  onSubmit: (content) => emit('submit', content),
})

const {
  handleChange,
  handleInstructionPick,
  instructionOption
} = useChatMessageSendInstruction(props.instructionMap)

defineExpose({
  clear,
  convertContentBlockToSlotConfig,
  getSlotConfigValue,
})

</script>

<template>
  <ax-sender
    ref="senderRef"
    :slot-config="props.disabled ? undefined : props.slotConfig"
    :suffix="false"
    :placeholder="placeholder"
    :disabled="props.disabled"
    :read-only="unref(isSending) || props.disabled"
    :class-names="{
      input: 'chat-sender-input',
      footer:'p-xs! border-t border-t-border-secondary'
    }"
    @change="handleChange"
    @paste-file="onPasteFiles"
    @submit="handleSubmit"
  >
    <template #header>
      <a-flex gap="small" wrap
              class="w-full p-xs bg-layout border-b border-b-border-secondary rounded-t-xl">
        <l-chat-message-reference
          variant="outlined"
          closable
          @click="emit('jumpToReference', r)"
          @close="() => refMessages = refMessages.filter(m => m.id !== r.id)"
          :message="r"
          :key="r.id"
          v-for="r of refMessages"
        />
      </a-flex>
    </template>

    <template #footer="{ components }" v-if="!props.disabled">
      <a-flex justify="space-between" align="center" gap="small">
        <a-space>
          <l-emoji-button :disabled="isSending" @selected="onSelectedEmoji" />
        </a-space>
        <a-flex justify="space-between" align="center" gap="small">
          <component
            :disabled="isSending"
            :is="components.ClearButton"
            @click="clear"
          />
          <component
            :disabled="isSending"
            :is="isSending ? components.LoadingButton : components.SendButton"
            type="primary"
          />
        </a-flex>
      </a-flex>
    </template>
  </ax-sender>
  <teleport to="body">
    <a-popover
      v-model:open="instructionOption.open"
      :trigger="[]"
      :destroy-tooltip-on-hide="false"
    >
      <template #content>
        <div v-if="instructionOption.dataSource.length > 0" class="max-h-60 overflow-auto" @mousedown.prevent>
          <div
            v-for="(item, index) in instructionOption.dataSource"
            :key="item.value"
            class="px-3 py-2 cursor-pointer rounded-sm"
            :class="index === instructionOption.activeIndex ? 'bg-primary-bg' : 'hover:bg-fill-secondary'"
            @mouseenter="handleInstructionPick(item)"
            @click="handleInstructionPick(item)"
          >
            {{ item.value }}
          </div>
        </div>
        <a-empty v-else/>
      </template>
      <span
        class="fixed w-px h-[1em] pointer-events-none"
        :style="instructionOption.anchorStyle"
      />
    </a-popover>
  </teleport>
</template>
