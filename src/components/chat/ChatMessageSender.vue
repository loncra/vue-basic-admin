<script setup lang="ts">
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
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

const props = withDefaults(defineProps<{
  slotConfig?: SlotConfigType[]
  placeholder: string
  sending?: boolean
  uploadOptions?: Record<string, unknown>
  disabled: boolean
  instructionContextVisibleMargin?:number
  instructionMap?: Record<string, IdValueMetadata<string, string>[]>
  filterInstruction?:(keyword:string, dataSource:IdValueMetadata<string, string>[], prefix:string) => IdValueMetadata<string, string>[],
  senderInsertInstruction?:(sender:SenderRef, block:SlotConfigType) => void
}>(), {
  placeholder: '',
  sending: false,
  uploadBucket: 'system.file',
  disabled: false,
  instructionContextVisibleMargin:8,
  instructionMap: () => ({}),
  filterInstruction: (_keyword, dataSource) => dataSource,
  senderInsertInstruction:(sender:SenderRef, block:SlotConfigType) => sender.insert([block,{type:'text',value:' '}], 'cursor')
})

const refMessages = defineModel<UserChatMessageResponseBody[]>("refMessages", {default: () => []})
const slots = defineSlots()

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
  instructionPopoverRef,
  handleSenderChange,
  handleSenderKeyDown,
  handleInstructionPick,
  instructionOption
} = useChatMessageSendInstruction({
  instructionMap: toRef(props, "instructionMap"),
  contextVisibleMargin:toRef(props, "instructionContextVisibleMargin"),
  disabled: toRef(props, "disabled"),
  senderRef: senderRef,
  onFilterDataSource: props.filterInstruction,
  senderInsertInstruction: props.senderInsertInstruction
})

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
    @change="handleSenderChange"
    @paste-file="onPasteFiles"
    @key-down="handleSenderKeyDown"
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
          <l-emoji-button type="text" :disabled="isSending" @selected="onSelectedEmoji"/>
          <slot name="leftButtonExtra"></slot>
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
      ref="instructionPopoverRef"
      :open="instructionOption.open && instructionOption.displayDataSource.length > 0"
      :trigger="[]"
      :destroy-tooltip-on-hide="false"
    >
      <template #content>
        <div class="max-h-60 max-w-60 overflow-auto"
             @mousedown.prevent>
          <div
            v-for="(item, index) in instructionOption.displayDataSource"
            :key="item.id"
            class="p-xs cursor-pointer rounded-sm"
            :class="index === instructionOption.activeIndex ? 'bg-primary-bg' : 'hover:bg-fill-secondary'"
            @mouseenter="instructionOption.activeIndex = index"
            @click="handleInstructionPick(item)"
          >
            <slot v-if="slots.instructionItemRender" name="instructionItemRender" :index="index" :item="item" :prefix="instructionOption.measure.prefix" />
            <template v-else>
              {{ item.value }}
            </template>
          </div>
        </div>
      </template>
      <span
        class="fixed w-px h-[1em] pointer-events-none"
        :style="instructionOption.anchorStyle"
      />
    </a-popover>
  </teleport>
</template>
