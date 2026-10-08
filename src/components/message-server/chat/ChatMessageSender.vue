<script setup lang="ts">
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {ChatContentBlock} from "@/types/composables";
import type {UserChatMessageResponseBody} from "@/types/apis";
import type {IdValueMetadata} from "@loncra/client/commons";
import type {DraftRestoreResult} from '@loncra/chat-core'
import type {ImDraftLive} from '@/composables/chat/draft'
import {createImDraftCodec, getDraft, putDraft, clearDraft} from '@/composables/chat/draft'
import {useChatMessageSender} from "@/composables/message-server/chat";
import {type ComponentInternalInstance, getCurrentInstance, ref, toRef} from "vue";
import {
  type DraftBinding,
  ImSender as LImSender,
  type ImSenderExpose,
  type InstructionMeasure,
  type InstructionSenderHandle,
} from '@loncra/antdv-chat'
import LChatMessageReference from "@/components/message-server/chat/ChatMessageReference.vue";
import {createInstructionSlot as buildInstructionSlot, requireNonNullOrUndefined} from '@/utils'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'

defineOptions({
  name: 'LChatMessageSender',
})

const props = withDefaults(defineProps<{
  /** 本实例对应的房间。key 重建后旧实例仍读自己的 id，卸载刷盘不会写到下一间。 */
  targetId: string
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
  change: [value: string, event?: Event, slotConfigType?: SlotConfigType[]]
  appliedSlots: [slots: SlotConfigType[]]
}>()

const draftSenderRef = ref<ImSenderExpose>()
const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()

function principalName(): string | undefined {
  const name = principalStore.state.name
  return name ? name : undefined
}

function draftCodec() {
  return createImDraftCodec({
    restoreFilesSlot: (files, key) => createFilesSlot(files, key),
    restoreInstructionSlot: (block) =>
      buildInstructionSlot(block, configProviderStore, currentInstance),
  })
}

const binding: DraftBinding<ImDraftLive> = {
  key: () => {
    const principal = principalName()
    return principal && props.targetId ? `${principal}:im:${props.targetId}` : undefined
  },
  async save(live) {
    const principal = principalName()
    if (!principal || !props.targetId) {
      return
    }
    const codec = draftCodec()
    await putDraft(codec.toRecord(live, {principal, targetId: props.targetId}), codec.collectBlobs(live))
  },
  async load() {
    const principal = principalName()
    if (!principal || !props.targetId) {
      return null
    }
    const stored = await getDraft('im', principal, props.targetId)
    if (!stored || stored.record.scope !== 'im') {
      return null
    }
    return draftCodec().fromRecord(stored.record, stored.blobs)
  },
  async clear() {
    const principal = principalName()
    if (!principal || !props.targetId) {
      return
    }
    await clearDraft('im', principal, props.targetId)
  },
}

function readLive(): ImDraftLive {
  return {
    slots: draftSenderRef.value?.getSlotConfigValue() ?? props.slotConfig ?? [],
    refMessages: [...refMessages.value],
  }
}

function slotsOf(live: unknown): SlotConfigType[] {
  return (live as ImDraftLive).slots
}

function onRestore(result: DraftRestoreResult<unknown, SlotConfigType[]>): void {
  const live = result.live as ImDraftLive | null
  if (!result.found || !live) {
    refMessages.value = []
    return
  }
  refMessages.value = [...live.refMessages]
  if (result.applySlots && result.slots) {
    emit('appliedSlots', result.slots)
  }
}

function onInsertInstruction(
  sender: InstructionSenderHandle,
  block: object,
  measure: InstructionMeasure,
) {
  props.senderInsertInstruction(sender as SenderRef, block as SlotConfigType, measure)
}

const {
  isSending,
  onPasteFiles,
  handleSubmit,
  clear,
  convertContentBlockToSlotConfig,
  getSlotConfigValue,
  createFilesSlot,
  createInstructionSlot,
} = useChatMessageSender({
  refMessages,
  sending: toRef(props, 'sending'),
  getUploadOptions: () => props.uploadOptions,
  onSubmit: (content) => emit('submit', content),
  getSender: () => draftSenderRef.value?.getSender() as SenderRef | undefined,
})

defineExpose({
  clear,
  convertContentBlockToSlotConfig,
  getSlotConfigValue,
  createFilesSlot,
  flush: () => draftSenderRef.value?.flush() ?? Promise.resolve(),
  clearStored: () => draftSenderRef.value?.clearStored() ?? Promise.resolve(),
})
</script>

<template>
  <!-- 输入区样式钩子：宿主的 .chat-sender-input 靠 InstructionSender 的 inputClass 默认值注入 -->
  <l-im-sender
    ref="draftSenderRef"
    :binding="binding"
    :read-live="readLive"
    :slots-of="slotsOf"
    :on-restore="onRestore"
    :save-source="refMessages"
    :ref-messages="refMessages"
    :slot-config="props.slotConfig"
    :placeholder="placeholder"
    :sending="isSending"
    :disabled="props.disabled"
    :instruction-context-visible-margin="props.instructionContextVisibleMargin"
    :instruction-map="props.instructionMap"
    :on-filter-data-source="props.filterInstruction"
    :sender-insert-instruction="onInsertInstruction"
    :create-instruction-slot="createInstructionSlot"
    @paste-file="onPasteFiles"
    @submit="handleSubmit"
    @change="(value, event, slotConfig) => emit('change', value, event, slotConfig)"
  >
    <template #reference="{message}">
      <l-chat-message-reference
        variant="outlined"
        closable
        :message="message"
        @click="emit('jumpToReference', message)"
        @close="() => refMessages = refMessages.filter(m => m.id !== message.id)"
      />
    </template>

    <template #leftExtra>
      <slot name="leftExtra" />
    </template>

    <template v-if="slots.rightExtra" #rightExtra>
      <slot name="rightExtra" />
    </template>

    <template v-if="slots.instructionItemRender" #instructionItemRender="slotProps">
      <slot name="instructionItemRender" v-bind="slotProps" />
    </template>
  </l-im-sender>
</template>
