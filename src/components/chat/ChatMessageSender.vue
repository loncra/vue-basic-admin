<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, h, nextTick, ref} from "vue";
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {
  AttachmentBlock,
  ChatContentBlock,
  CursorContext,
  FilesSlotProps,
  ReferenceBlock,
  TextBlock
} from "@/types/composables";
import {Sender as AxSender, XProvider as AxConfigProvider} from '@antdv-next/x'
import LAttachmentUpload from '@/components/attachment/AttachmentUpload.vue'
import type {
  AttachmentUploadExpose,
  AttachmentValue
} from "@/types/composables/attachmentUpload.ts";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {isObjectWriteResult, requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {TYPING_ANCHOR} from "@/constants/messageConstant.ts";
import type {ObjectWriteResult, UserChatMessageResponseBody} from "@/types/apis";
import LChatMessageReference from "@/components/chat/MessageReference.vue";

defineOptions({
  name: 'LChatMessageSender',
})

const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())

const configProviderStore = useConfigProviderStore()

const uploadRefMap = new Map<string, AttachmentUploadExpose>()
const senderRef = ref<SenderRef>()

const uploading = ref<boolean>(false)

const sending = defineModel<boolean>("sending", {default: false})
const refMessages = defineModel<UserChatMessageResponseBody[]>("refMessages", {default:() =>[]})

const props = withDefaults(defineProps<{
  slotConfig?:SlotConfigType[]
  placeholder:string,
  uploadOptions?:Record<string, unknown>,
  disabled:boolean
}>(),{
  slotConfig:() => [],
  placeholder:'',
  uploadBucket:'system.file',
  disabled:false
})

const emit = defineEmits<{
  submit: [content: ChatContentBlock[]]
  jumpToReference:[body:UserChatMessageResponseBody]
}>()

function slotTextRaw(slot: SlotConfigType): string {
  return slot.type === 'text' ? (slot.value ?? '') : ''
}

function isAnchorOrEmptyText(text: string): boolean {
  return text.replace(new RegExp(TYPING_ANCHOR, 'g'), '').trim() === ''
}

function bindUploadRef(slotKey: string, inst: unknown) {
  if (!slotKey) return
  const exposed =
    (inst as AttachmentUploadExpose | null)?.upload
      ? (inst as AttachmentUploadExpose)
      : (inst as { exposed?: AttachmentUploadExpose } | null)?.exposed
  if (exposed?.upload) {
    uploadRefMap.set(slotKey, exposed)
  } else {
    uploadRefMap.delete(slotKey)
  }
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
    customRender: fileCustomRender,
  }
}

function serializeSlots(sender: SenderRef): SlotConfigType[] {
  const result: SlotConfigType[] = []
  for (const slot of sender.getValue().slotConfig ?? []) {
    if (slot.type === 'content') {
      continue
    }
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
  const lastText = last?.type === 'text' ? slotTextRaw(last) : ''
  if (last?.type === 'text' && lastText.includes(TYPING_ANCHOR)) {
    focusAndScrollToEnd(sender)
    return
  }
  sender.insert([{type: 'text', value: TYPING_ANCHOR}], 'end')
  focusAndScrollToEnd(sender)
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
  focusAndScrollToEnd(sender)
}

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
   const slotKey = 'key' in item && item.key ? item.key : ''
  const node = h(
    AxConfigProvider,
    {
      locale: (configProviderStore.localeMessage as { antDesign?: object }).antDesign,
      componentSize: configProviderStore.state.componentSize,
      theme: providerTheme(),
    },
    {
      default: () =>
        h(LAttachmentUpload, {
          bucket:'temp',
          uploadOptions:props.uploadOptions,
          ref: (inst) => bindUploadRef(slotKey, inst),
          value,
          multiple: true,
          maxCount: value.length,
          'onUpdate:value': (next: AttachmentValue) => handleFilesSlotChange(item, next, onChange),
        }),
    },
  )
  node.appContext = currentInstance.appContext
  return node
}

function providerTheme() {
  const raw = configProviderStore.getAlgorithm()
  const algorithm =
    raw == null
      ? undefined
      : Array.isArray(raw)
        ? raw.filter((item) => item != null)
        : raw
  return { algorithm, token: configProviderStore.state.token }
}

function getEditableRoot(sender: SenderRef): HTMLElement | null {
  const root = sender.nativeElement
  if (root.isContentEditable) {
    return root
  }
  return (
    root.querySelector<HTMLElement>('[contenteditable="true"]')
  )
}

function findDirectChildContaining(editable: HTMLElement, node: Node): ChildNode | null {
  let cur: Node | null = node
  while (cur && cur !== editable) {
    if (cur.parentNode === editable) {
      return cur as ChildNode
    }
    cur = cur.parentNode
  }
  return null
}

function advanceSlotIdx(slots: SlotConfigType[], slotIdx: number, child: Node): number {
  if (child.nodeType === Node.TEXT_NODE) {
    const text = child.textContent ?? ''
    if (!text) {
      return slotIdx
    }
    return slots[slotIdx]?.type === 'text' ? slotIdx + 1 : slotIdx
  }
  if (child instanceof HTMLElement && child.dataset.slotKey && child.dataset.nodeType !== 'nbsp') {
    return slotIdx + 1
  }
  return slotIdx
}

function resolveCursorContext(sender: SenderRef): CursorContext | null {
  const editable = getEditableRoot(sender)
  const sel = window.getSelection()
  if (!editable || !sel?.rangeCount || !sel.anchorNode || !editable.contains(sel.anchorNode)) {
    return null
  }
  const slots = sender.getValue().slotConfig ?? []
  const { anchorNode, anchorOffset } = sel
  // 容器选区：光标在 editable 子节点缝隙里（空行、块后最常见）
  if (anchorNode === editable) {
    let slotIdx = 0
    for (let i = 0; i < anchorOffset; i++) {
      const child = editable.childNodes[i]
      if (child) {
        slotIdx = advanceSlotIdx(slots, slotIdx, child)
      }
    }
    return { slotIdx, textOffset: 0, isAtLineStart: true }
  }
  const directChild = findDirectChildContaining(editable, anchorNode)
  if (!directChild) {
    return null
  }
  let slotIdx = 0
  for (const child of editable.childNodes) {
    if (child !== directChild) {
      slotIdx = advanceSlotIdx(slots, slotIdx, child)
      continue
    }
    if (child.nodeType === Node.TEXT_NODE) {
      const textNode = child as Text
      const offset =
        anchorNode.nodeType === Node.TEXT_NODE && anchorNode === textNode
          ? anchorOffset
          : 0
      return {
        slotIdx,
        textOffset: offset,
        isAtLineStart: offset === 0,
      }
    }
    if (child instanceof HTMLBRElement) {
      return { slotIdx, textOffset: 0, isAtLineStart: true }
    }
    // custom / content 词槽（含 AttachmentUpload portal）
    return { slotIdx, textOffset: 0, isAtLineStart: true }
  }
  return null
}

function popLastFileFromSlot(slots: SlotConfigType[], key: string): SlotConfigType[] {
  return slots.flatMap((slot) => {
    if (!isFilesSlot(slot) || slot.key !== key) {
      return [slot]
    }
    const files = [...slot.props.defaultValue]
    files.pop()
    if (files.length === 0) {
      return []
    }
    return [createFilesSlot(files, slot.key)]
  })
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

  sender.insert([slot], 'cursor')
  appendTypingAnchor(sender)
}

function onChange(_value: string, _event?: Event, _slotConfig?: SlotConfigType[]) {
  const sender = senderRef.value
  if (!sender) {
    return
  }

  const ctx = resolveCursorContext(sender)
  if (ctx === null && (_slotConfig || [])?.some(s => s.type === 'custom')) {
    applySlots(sender, popLastFileFromSlot(serializeSlots(sender), (_slotConfig || []).at(-1)?.key ?? ''))
  } else if (ctx !== null && ctx.slotIdx > 1 && ctx.isAtLineStart) {
    const prevSlot = (_slotConfig|| [])[ctx.slotIdx - 1]
    if (!prevSlot || !isFilesSlot(prevSlot)) {
      return
    }
    if (_event && (_event as InputEvent).inputType === 'deleteContentBackward') {
      applySlots(sender, popLastFileFromSlot(serializeSlots(sender), prevSlot.key))
    }
  }

}

function focusAndScrollToEnd(sender: SenderRef) {
  sender.focus({ cursor: 'end' })
  nextTick(() => {
    const el = getEditableRoot(sender) // 你已有
    if (!el) {
      return
    }
    el.scrollTop = el.scrollHeight
    requestAnimationFrame(() => el.scrollTop = el.scrollHeight)
  })
}

async function onSubmit(_message: string, _slotConfig?: SlotConfigType[]) {
  const sender = senderRef.value
  if (!sender || !_slotConfig?.length) {
    return
  }
  uploading.value = true
  try {
    const blocks:ChatContentBlock[] = []
    // 1. 逐个 files 词槽上传
    for (const slot of _slotConfig) {
      if (isFilesSlot(slot) && slot.key) {
        const uploaded = await uploadRefMap.get(slot.key)?.upload()
        const files:ObjectWriteResult[] = (Array.isArray(uploaded) ? uploaded : uploaded ? [uploaded] : [])
          .filter((f): f is ObjectWriteResult => isObjectWriteResult(f))
        const attachmentBlock:AttachmentBlock = {
          files:files,
          type:'custom',
          slotKind:'files'
        }
        blocks.push(attachmentBlock)
      } else {
        const text = slotTextRaw(slot).replace(new RegExp(TYPING_ANCHOR, 'g'), '').trim()
        if (!text) {
          continue
        }
        const textBlock:TextBlock = {
          type: 'text',
          value: text
        }
        blocks.push(textBlock)
      }
    }
    if (refMessages.value.length > 0) {
      const referenceBlock:ReferenceBlock = {
        type:'custom',
        slotKind:'reference',
        value: refMessages.value
      }
      blocks.push(referenceBlock)
    }
    emit('submit', blocks)
    refMessages.value = []
  } finally {
    uploading.value = false
  }
}

function clear() {
  const sender = senderRef.value
  if (!sender) {
    return
  }
  sender.clear()
  focusAndScrollToEnd(sender)
}

defineExpose({
  clear
})

</script>

<template>
  <ax-sender
    ref="senderRef"
    :slot-config="props.disabled ? undefined : props.slotConfig"
    :placeholder="props.placeholder"
    :suffix="false"
    allow-speech
    :disabled="props.disabled"
    :auto-size="true"
    :class-names="{
      content: 'chat-sender-content',
      input: 'chat-sender-input',
      footer:'p-xs! border-t border-t-border-secondary'
    }"
    :loading="uploading || sending"
    @paste-file="onPasteFiles"
    @change="onChange"
    @submit="onSubmit"
  >
    <template #header>
      <a-flex gap="small" wrap class="w-full p-xs bg-layout border-b border-b-border-secondary rounded-t-xl">
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
          <a-button type="text" >
            <template #icon>
              <icon-font type="loncra-smile" />
            </template>
          </a-button>
        </a-space>
        <a-flex justify="space-between" align="center" gap="small">
          <component :is="components.ClearButton" @click="clear" />
<!--          <component :is="components.SpeechButton" />-->
          <component
            :is="uploading || sending ? components.LoadingButton : components.SendButton"
            type="primary"
          />
        </a-flex>
      </a-flex>
    </template>
  </ax-sender>
</template>
