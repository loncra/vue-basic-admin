<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, h, ref} from "vue";
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {ChatMessageContent, ObjectWriteResult} from "@/types/apis";
import {Sender as AxSender} from '@antdv-next/x'
import LAttachmentUpload from '@/components/attachment/AttachmentUpload.vue'
import type {AttachmentValue} from "@/types/composables/attachmentUpload.ts";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LChatMessageSender',
})

// --- 词槽类型 ---

type FilesSlotKind = 'files'

type FilesSlotProps = {
  slotKind: FilesSlotKind
  defaultValue: UploadFile<ObjectWriteResult>[]
}

const TYPING_ANCHOR = '\u200B'

const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())

const emit = defineEmits<{
  submit: [content: ChatMessageContent]
}>()

const senderRef = ref<SenderRef>()
const modeValue = defineModel<SlotConfigType[]>("value", {default: () => []})

const options = ref({
  uploading: false,
  sending: false,
})

// --- 词槽工具函数 ---

function slotTextRaw(slot: SlotConfigType): string {
  return slot.type === 'text' ? (slot.value ?? '') : ''
}

function isAnchorOrEmptyText(text: string): boolean {
  return text.replace(/\u200B/g, '').trim() === ''
}

function stripTrailingEmptyText(slots: SlotConfigType[]): SlotConfigType[] {
  const copy = [...slots]
  while (copy.length > 0) {
    const last = copy[copy.length - 1]
    if (last?.type === 'text' && isAnchorOrEmptyText(slotTextRaw(last))) {
      copy.pop()
    } else {
      break
    }
  }
  return copy
}

function isFilesSlot(slot: SlotConfigType): slot is SlotConfigType & { key: string; props: FilesSlotProps } {
  return slot.type === 'custom' && slot.props?.slotKind === 'files'
}

function toUploadFile(file: File): UploadFile<ObjectWriteResult> {
  return {
    uid: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    originFileObj: file as UploadFile<ObjectWriteResult>['originFileObj'],
  }
}

function createFilesSlot(
  files: UploadFile<ObjectWriteResult>[],
  key: string = crypto.randomUUID(),
): SlotConfigType {
  return {
    type: 'custom',
    key,
    props: {slotKind: 'files', defaultValue: files},
    formatResult: () => '',
    customRender: fileCustomRender,
  }
}

function serializeSlots(sender: SenderRef): SlotConfigType[] {
  const result: SlotConfigType[] = []
  for (const slot of sender.getValue().slotConfig ?? []) {
    if (slot.type === 'content') continue
    if (slot.type === 'text') {
      result.push({type: 'text', value: slotTextRaw(slot)})
      continue
    }
    if (isFilesSlot(slot)) {
      const files = [...(slot.props.defaultValue ?? [])]
      if (files.length > 0) {
        result.push(createFilesSlot(files, slot.key))
      }
    }
  }
  return stripTrailingEmptyText(result)
}

function appendTypingAnchor(sender: SenderRef) {
  const slots = sender.getValue().slotConfig ?? []
  const last = slots[slots.length - 1]
  if (last?.type === 'text' && isAnchorOrEmptyText(slotTextRaw(last))) {
    sender.focus({cursor: 'end'})
    return
  }
  sender.insert([{type: 'text', value: TYPING_ANCHOR}], 'end')
  sender.focus({cursor: 'end'})
}

function applySlots(sender: SenderRef, slots: SlotConfigType[]) {
  const finalSlots: SlotConfigType[] = [
    ...stripTrailingEmptyText(slots),
    {type: 'text', value: TYPING_ANCHOR}
  ]
  sender.clear()
  if (finalSlots.length > 0) {
    sender.insert(finalSlots, 'start')
  }
  sender.focus({cursor: 'end'})
}

// --- 附件词槽渲染 ---

function handleFilesSlotChange(
  item: SlotConfigType,
  next: AttachmentValue,
  senderOnChange: (value: AttachmentValue) => void,
) {
  const files = Array.isArray(next) ? next : next ? [next] : []
  const sender = senderRef.value
  if (!sender || !('key' in item) || !item.key) {
    return
  }
  if (files.length === 0) {
    applySlots(sender, serializeSlots(sender).filter((s) => s.key !== item.key))
    return
  }
  senderOnChange(files)
}

function fileCustomRender(
  value: UploadFile<ObjectWriteResult>[],
  onChange: (value: AttachmentValue) => void,
  _props: { disabled?: boolean; readOnly?: boolean },
  item: SlotConfigType,
) {
  const node = h(LAttachmentUpload, {
    value: value,
    multiple: true,
    maxCount: value.length,
    'onUpdate:value': (next)  => handleFilesSlotChange(item, next, onChange)
  })
  node.appContext = currentInstance.appContext
  return node
}

function getCursorSlotConfigIndex(sender: SenderRef): number {
  const editable = sender.nativeElement
  const sel = window.getSelection()
  if (!sel?.rangeCount || !sel.anchorNode || !editable.contains(sel.anchorNode)) {
    return -1
  }
  const anchorNode = sel.anchorNode
  const slots = sender.getValue().slotConfig ?? []
  let slotIdx = 0
  for (const child of editable.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? ''
      if (!text) continue
      if (child === anchorNode || child.contains(anchorNode)) {
        return slotIdx
      }
      if (slots[slotIdx]?.type === 'text') slotIdx++
      continue
    }
    if (child instanceof HTMLElement && child.dataset.slotKey) {
      if (child.dataset.nodeType === 'nbsp') continue
      if (child === anchorNode || child.contains(anchorNode)) {
        return slotIdx
      }
      slotIdx++
    }
  }
  return -1
}

function isCursorInEmptyTextSlot(sender: SenderRef): boolean {
  const idx = getCursorSlotConfigIndex(sender)
  if (idx < 0) return false
  const slot = sender.getValue().slotConfig?.[idx]
  return slot?.type === 'text' && isAnchorOrEmptyText(slotTextRaw(slot))
}

function onPasteFiles(fileList: FileList) {
  const sender = senderRef.value
  if (!sender) {
    return
  }
  const files = Array.from(fileList) as File[]
  if (files.length === 0) {
    return
  }
  const slot = createFilesSlot(files.map(toUploadFile))
  if (isCursorInEmptyTextSlot(sender)) {
    const idx = getCursorSlotConfigIndex(sender)
    const slots = serializeSlots(sender)
    if (idx >= 0 && idx < slots.length && slots[idx]?.type === 'text') {
      slots[idx] = slot
      applySlots(sender, slots)
      return
    }
  }
  sender.insert([slot], 'cursor')
  appendTypingAnchor(sender)
}

function onChange(_value: string, _event?: Event, _slotConfig?: SlotConfigType[]) {
  // 步骤 3/4 将在此处理 Backspace 与 canSend
  console.info(_slotConfig)
}

async function onSubmit(_message: string, _slotConfig?: SlotConfigType[]) {
  // 步骤 5 实现上传与提交
}

function onClear() {
  const sender = senderRef.value
  if (!sender) return
  modeValue.value = []
  sender.clear()
  sender.focus({cursor: 'end'})
}
</script>

<template>
  <ax-sender
    ref="senderRef"
    :slot-config="modeValue"
    placeholder="输入消息，可粘贴文件到此处发送文件内容"
    :suffix="false"
    :auto-size="true"
    :class-names="{
      content: 'chat-sender-content',
      input: 'chat-sender-input',
      footer:'border-t border-t-border-secondary'
    }"
    :loading="options.uploading || options.sending"
    @paste-file="onPasteFiles"
    @change="onChange"
    @submit="onSubmit"
  >
    <template #footer="{ components }">
      <a-flex justify="flex-end" align="center" gap="small">
        <component :is="components.ClearButton" @click="onClear" />
        <component
          :is="options.uploading || options.sending ? components.LoadingButton : components.SendButton"
          type="primary"
          :disabled="!senderRef"
        />
      </a-flex>
    </template>
  </ax-sender>
</template>
