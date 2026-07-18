<script setup lang="ts">
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {InstructionMeasure} from "@/types/composables";
import {Sender as AxSender} from '@antdv-next/x'
import type {IdValueMetadata} from "@/types/apis";
import {useInstructionSender} from "@/composables/basic/useInstructionSender.ts";
import {ref, toRef, unref} from "vue";

defineOptions({
  name: 'LInstructionSender',
})

const props = withDefaults(defineProps<{
  slotConfig?: SlotConfigType[]
  placeholder: string
  sending?: boolean
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
  inputClass?: string
}>(), {
  placeholder: '',
  sending: false,
  disabled: false,
  instructionContextVisibleMargin: 8,
  instructionMap: () => ({}),
  filterInstruction: (_keyword, dataSource) => dataSource,
  senderInsertInstruction: (sender, block, measure) =>
    sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword),
  inputClass: 'chat-sender-input',
})

const slots = defineSlots<{
  header?: () => unknown
  leftExtra?: () => unknown
  rightExtra?: () => unknown
  instructionItemRender?: (props: {
    index: number
    item: IdValueMetadata<string, string>
    prefix: string
  }) => unknown
}>()

const emit = defineEmits<{
  submit: [value: string, slotConfig?: SlotConfigType[]]
  pasteFile: [fileList: FileList]
}>()

const senderRef = ref<SenderRef>()
const isSending = toRef(props, 'sending')

const {
  instructionPopoverRef,
  handleSenderChange,
  handleSenderKeyDown,
  handleInstructionPick,
  instructionOption,
} = useInstructionSender({
  instructionMap: toRef(props, 'instructionMap'),
  contextVisibleMargin: toRef(props, 'instructionContextVisibleMargin'),
  disabled: toRef(props, 'disabled'),
  senderRef,
  onFilterDataSource: props.filterInstruction,
  senderInsertInstruction: props.senderInsertInstruction,
})

function clear(): void {
  const sender = senderRef.value
  if (!sender) {
    return
  }
  sender.clear()
  sender.focus({cursor: 'end'})
}

function getSlotConfigValue(): SlotConfigType[] {
  return senderRef.value?.getValue()?.slotConfig || []
}

function getSender(): SenderRef | undefined {
  return senderRef.value
}

defineExpose({
  clear,
  getSlotConfigValue,
  getSender,
  senderRef,
})
</script>

<template>
  <ax-sender
    ref="senderRef"
    :slot-config="props.disabled ? undefined : (props.slotConfig ?? [])"
    :suffix="false"
    :placeholder="placeholder"
    :disabled="props.disabled"
    :read-only="unref(isSending) || props.disabled"
    :class-names="{
      input: props.inputClass,
      footer: 'p-xs! border-t border-t-border-secondary'
    }"
    @change="handleSenderChange"
    @paste-file="emit('pasteFile', $event)"
    @key-down="handleSenderKeyDown"
    @submit="(value, slotConfig) => emit('submit', value, slotConfig)"
  >
    <template v-if="slots.header" #header>
      <slot name="header" />
    </template>

    <template #footer="{ components }" v-if="!props.disabled">
      <a-flex justify="space-between" align="center" gap="small">
        <a-space>
          <slot name="leftExtra" />
        </a-space>
        <a-flex align="center" gap="small">
          <slot name="rightExtra" />
          <component
            :is="components.ClearButton"
            :disabled="isSending"
            @click="clear"
          />
          <component
            :is="isSending ? components.LoadingButton : components.SendButton"
            :disabled="isSending"
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
            <slot
              v-if="slots.instructionItemRender"
              name="instructionItemRender"
              :index="index"
              :item="item"
              :prefix="instructionOption.measure.prefix"
            />
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
