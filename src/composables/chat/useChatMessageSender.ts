import {
  type ComponentInternalInstance, computed, getCurrentInstance, h,
  type MaybeRef, type Ref, ref, unref
} from 'vue'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
  AttachmentBlock,
  ChatContentBlock, CursorContext,
  FilesSlotProps,
  ReferenceBlock,
} from '@/types/composables'
import {XProvider as AxConfigProvider} from '@antdv-next/x'
import LAttachmentUpload from '@/components/attachment/AttachmentUpload.vue'
import type {
  AttachmentUploadExpose,
  AttachmentValue,
} from '@/types/composables/attachmentUpload.ts'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {convertUploadFiles, isObjectWriteResult, requireNonNullOrUndefined} from '@/utils'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import type {ObjectWriteResult, UserChatMessageResponseBody} from '@/types/apis'

export interface UseChatMessageSenderParams {
  refMessages: Ref<UserChatMessageResponseBody[]>
  sending:MaybeRef<boolean>
  getUploadOptions: () => Record<string, unknown> | undefined
  onSubmit: (content: ChatContentBlock[]) => void
}

/**
 * 发送器逻辑：files 词槽创建/渲染/上传、粘贴文件、提交组装（附件 + 引用）、
 * 草稿与内容块互转、清空。
 */
export function useChatMessageSender(params: UseChatMessageSenderParams) {
  const {sending, refMessages, getUploadOptions, onSubmit: emitSubmit} = params
  const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
  const configProviderStore = useConfigProviderStore()

  const uploadRefMap = new Map<string, AttachmentUploadExpose>()
  const uploading = ref<boolean>(false)
  const senderRef = ref<SenderRef>()

  const isSending = computed(() => unref(sending)  || uploading.value)

  function bindUploadRef(slotKey: string, inst: unknown): void {
    if (!slotKey) return
    const exposed = (inst as AttachmentUploadExpose | null)?.upload
      ? (inst as AttachmentUploadExpose)
      : (inst as {exposed?: AttachmentUploadExpose} | null)?.exposed
    if (exposed?.upload) {
      uploadRefMap.set(slotKey, exposed)
    } else {
      uploadRefMap.delete(slotKey)
    }
  }

  function isFilesSlot(
    slot: SlotConfigType,
  ): slot is SlotConfigType & {key: string; props: FilesSlotProps} {
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

  function handleFilesSlotChange(
    item: SlotConfigType,
    next: AttachmentValue,
    senderOnChange: (value: AttachmentValue) => void,
  ): void {
    const files = Array.isArray(next) ? next : next ? [next] : []
    const sender = senderRef.value
    if (!sender || !('key' in item) || !item.key) {
      return
    }
    senderOnChange(files)
  }

  function fileCustomRender(
    value: UploadFile<ObjectWriteResult>[],
    onChange: (value: AttachmentValue) => void,
    _props: {disabled?: boolean; readOnly?: boolean},
    item: SlotConfigType,
  ) {
    const slotKey = 'key' in item && item.key ? item.key : ''
    const node = h(
      AxConfigProvider,
      {
        locale: (configProviderStore.localeMessage as {antDesign?: object}).antDesign,
        componentSize: configProviderStore.state.componentSize,
        theme: providerTheme(),
      },
      {
        default: () =>
          h(LAttachmentUpload, {
            bucket: 'temp',
            disabled: isSending.value,
            uploadOptions: getUploadOptions(),
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
      raw == null ? undefined : Array.isArray(raw) ? raw.filter((item) => item != null) : raw
    return {algorithm, token: configProviderStore.state.token}
  }

  function onPasteFiles(fileList: FileList): void {
    const files = Array.from(fileList) as File[]
    if (files.length === 0) {
      return
    }
    const slot = createFilesSlot(files.map(toUploadFile))
    const sender = senderRef.value
    if (!sender) {
      return
    }
    sender.insert([slot], 'cursor')
  }

  async function handleSubmit(_message: string, _slotConfig?: SlotConfigType[]): Promise<void> {
    if (!_slotConfig?.length) {
      return
    }
    uploading.value = true
    try {
      const blocks: ChatContentBlock[] = []
      // 1. 逐个 files 词槽上传
      for (const slot of _slotConfig) {
        if (isFilesSlot(slot) && slot.key) {
          const uploaded = await uploadRefMap.get(slot.key)?.upload()
          const files: ObjectWriteResult[] = (
            Array.isArray(uploaded) ? uploaded : uploaded ? [uploaded] : []
          ).filter((f): f is ObjectWriteResult => isObjectWriteResult(f))
          const attachmentBlock: AttachmentBlock = {
            files: files,
            type: 'custom',
            slotKind: 'files',
          }
          blocks.push(attachmentBlock)
        }
        blocks.push(slot as ChatContentBlock)
      }
      if (refMessages.value.length > 0) {
        const referenceBlock: ReferenceBlock = {
          type: 'custom',
          slotKind: 'reference',
          value: refMessages.value,
        }
        blocks.push(referenceBlock)
      }
      emitSubmit(blocks)
      refMessages.value = []
    } finally {
      uploading.value = false
    }
  }

  function onSelectedEmoji(emoji: string): void {
    senderRef.value?.insert([{type: 'text', value: emoji}], 'cursor')
  }

  function clear(): void {
    const sender = senderRef.value
    if (!sender) {
      return
    }
    sender.clear()
    sender.focus({cursor: 'end'})
  }

  function convertContentBlockToSlotConfig(content: ChatContentBlock[]): SlotConfigType[] {
    const result: SlotConfigType[] = []
    refMessages.value = []
    for (const slot of content) {
      if (slot.type === 'text') {
        result.push({
          type: 'text',
          value: slot.value,
        })
      } else if (slot.type === 'custom' && slot.slotKind === 'files') {
        result.push(createFilesSlot(convertUploadFiles(slot.files)))
      } else if (slot.type === 'custom' && slot.slotKind === 'reference') {
        refMessages.value = (slot as ReferenceBlock).value
      }
    }
    return result
  }

  function getSlotConfigValue(): SlotConfigType[] {
    return senderRef.value?.getValue()?.slotConfig || []
  }

  function getEditableRoot(): HTMLElement | null {
    if (!senderRef.value) {
      return null
    }
    const root = senderRef.value.nativeElement
    if (root.isContentEditable) {
      return root
    }
    return (
      root.querySelector<HTMLElement>('[contenteditable="true"]')
    )
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

  function focusSlot(slotKey: string, cursor: "start" | "end" | "all" | "slot") {

    const editable = getEditableRoot()
    if (!editable) {
      return
    }
    const slotEl = editable.querySelector<HTMLElement>(
      `[data-slot-key="${slotKey}"]:not([data-node-type="nbsp"])`,
    )
    if (!slotEl) {
      senderRef?.value?.focus({ cursor })
      return
    }
    editable.focus()
    const sel = window.getSelection()
    if (!sel) return
    const range = document.createRange()
    range.setStartAfter(slotEl)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function resolveCursorContext(): CursorContext | null {

    const editable = getEditableRoot()
    const sel = window.getSelection()
    if (!editable || !sel?.rangeCount || !sel.anchorNode || !editable.contains(sel.anchorNode)) {
      return null
    }
    const slots = senderRef?.value?.getValue()?.slotConfig ?? []
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

  return {
    senderRef,
    isSending,
    onPasteFiles,
    handleSubmit,
    onSelectedEmoji,
    focusSlot,
    resolveCursorContext,
    clear,
    convertContentBlockToSlotConfig,
    getSlotConfigValue,
  }
}

export type ChatMessageSenderApi = ReturnType<typeof useChatMessageSender>
