<script setup lang="ts">
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {ChatContentBlock, InstructionMeasure} from "@/types/composables";
import type {IdValueMetadata, UserChatMessageResponseBody} from "@/types/apis";
import {useChatMessageSender} from "@/composables/message-server/chat";
import {ref, toRef} from "vue";
import LEmojiButton from "@/components/basic/chat/EmojiButton.vue";
import LChatMessageReference from "@/components/message-server/chat/ChatMessageReference.vue";
import LInstructionSender from "@/components/basic/chat/InstructionSender.vue";

defineOptions({
  name: 'LChatMessageSender',
})

const props = withDefaults(defineProps<{
  slotConfig?: SlotConfigType[]
  placeholder: string
  sending?: boolean
  uploadOptions?: Record<string, unknown>
  disabled: boolean
  instructionContextVisibleMargin?: number
  instructionMap?: Record<string, IdValueMetadata<string, string>[]>
  filterInstruction?: (
    keyword: string,
    dataSource: IdValueMetadata<string, string>[],
    prefix: string,
  ) => IdValueMetadata<string, string>[]
  senderInsertInstruction?: (
    sender: SenderRef,
    block: SlotConfigType,
    measure: InstructionMeasure,
  ) => void
}>(), {
  placeholder: '',
  sending: false,
  uploadBucket: 'system.file',
  disabled: false,
  instructionContextVisibleMargin: 8,
  instructionMap: () => ({}),
  filterInstruction: (_keyword, dataSource) => dataSource,
  senderInsertInstruction: (sender, block, measure) =>
    sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword),
})

const refMessages = defineModel<UserChatMessageResponseBody[]>("refMessages", {default: () => []})
const slots = defineSlots()

const emit = defineEmits<{
  submit: [content: ChatContentBlock[]]
  jumpToReference: [body: UserChatMessageResponseBody]
}>()

const instructionSenderRef = ref<InstanceType<typeof LInstructionSender>>()

const {
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
  getSender: () => instructionSenderRef.value?.getSender(),
})

defineExpose({
  clear,
  convertContentBlockToSlotConfig,
  getSlotConfigValue,
})
</script>

<template>
  <l-instruction-sender
    ref="instructionSenderRef"
    :slot-config="props.slotConfig"
    :placeholder="placeholder"
    :sending="isSending"
    :disabled="props.disabled"
    :instruction-context-visible-margin="props.instructionContextVisibleMargin"
    :instruction-map="props.instructionMap"
    :filter-instruction="props.filterInstruction"
    :sender-insert-instruction="props.senderInsertInstruction"
    @paste-file="onPasteFiles"
    @submit="handleSubmit"
  >
    <template v-if="refMessages.length > 0" #header>
      <a-flex
        gap="small"
        wrap
        class="w-full p-xs bg-layout border-b border-b-border-secondary rounded-t-xl"
      >
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

    <template #leftExtra>
      <l-emoji-button type="text" :disabled="isSending" @selected="onSelectedEmoji"/>
      <slot name="leftExtra" />
    </template>

    <template v-if="slots.rightExtra" #rightExtra>
      <slot name="rightExtra" />
    </template>

    <template v-if="slots.instructionItemRender" #instructionItemRender="slotProps">
      <slot name="instructionItemRender" v-bind="slotProps" />
    </template>
  </l-instruction-sender>
</template>
