import {h, ref} from 'vue'
import {Image, Tag} from 'antdv-next'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {SlotConfigType, SenderRef} from '@antdv-next/x/dist/sender/interface'
import {AttachmentService} from '@/apis/resource-server/attachmentService.ts'
import {uploadFile} from '@/composables/attachment/useAttachmentUploadExecutor.ts'
import type {ImCustomSlotValue, ImSlotKind} from '@/types/composables/chatComposer'
import type {
  ChatContentBlock,
  ChatMessageContent,
  DraftBlock,
  DraftFileItem,
  DraftFilesBlock,
  DraftMediaBlock,
  TextSegment,
} from '@/types/apis/message-server/chatDomain'
import type {ObjectWriteResult} from '@/types/apis'

const UPLOAD_BUCKET = 'user.file'
const UPLOAD_OPTIONS = {postFilename: 'file', promiseLimit: 3}
const TYPING_ANCHOR = '\u200B'
export const CHAT_SENDER_SLOT_CONFIG: SlotConfigType[] = []

function slotTextRaw(slot: SlotConfigType): string {
  return (slot as {value?: string}).value ?? ''
}

function meaningfulText(value: string): string {
  return value.replace(/\u200B/g, '').trim()
}

function isAnchorOrEmptyText(value: string): boolean {
  return meaningfulText(value) === ''
}

function stripTrailingEmptyText(slots: SlotConfigType[]): SlotConfigType[] {
  const copy = [...slots]
  while (copy.length > 0) {
    const last = copy[copy.length - 1]
    if (last?.type === 'text' && isAnchorOrEmptyText(slotTextRaw(last))) copy.pop()
    else break
  }
  return copy
}

function withTypingTail(slots: SlotConfigType[]): SlotConfigType[] {
  return [...stripTrailingEmptyText(slots), {type: 'text', value: TYPING_ANCHOR}]
}

export function isChatMessageContent(v: unknown): v is ChatMessageContent {
  return !!v
    && typeof v === 'object'
    && (v as ChatMessageContent).type === 'composite'
    && (v as ChatMessageContent).version === 1
    && Array.isArray((v as ChatMessageContent).blocks)
}

export function segmentsToPlainText(segments: TextSegment[]): string {
  return segments.map((s) => {
    if (s.type === 'plain') return s.text
    if (s.type === 'mention') return `@${s.label}`
    return s.label
  }).join('')
}

function uid(): string {
  return crypto.randomUUID()
}

function detectMediaType(file: File): 'image' | 'video' | 'file' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

function toUploadFile(file: File): UploadFile {
  return {
    uid: uid(),
    name: file.name,
    size: file.size,
    type: file.type,
    originFileObj: file as UploadFile['originFileObj'],
    status: 'done',
  }
}

export function useChatComposer() {
  const draftStore: Record<string, DraftBlock> = {}
  const sending = ref(false)
  const uploading = ref(false)
  let activeSenderRef: SenderRef | null = null

  function createDraftFileItem(file: File): DraftFileItem {
    return {id: uid(), localFile: file, fileName: file.name, status: 'pending'}
  }

  function createDraftMediaBlock(file: File, type: 'image' | 'video'): DraftMediaBlock {
    return {
      id: uid(),
      type,
      localFile: file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: 'pending',
    }
  }

  function createDraftFilesBlock(file: File): DraftFilesBlock {
    return {id: uid(), type: 'files', items: [createDraftFileItem(file)]}
  }

  function renderMediaSlot(
    value: ImCustomSlotValue,
    _onChange: (v: ImCustomSlotValue) => void,
    _props: { disabled?: boolean; readOnly?: boolean },
    item: SlotConfigType,
  ) {
    const block = value as DraftMediaBlock
    draftStore[block.id] = block
    return h('div', {class: 'w-full max-w-full overflow-hidden'}, [
      block.type === 'image'
        ? h(Image, {src: block.previewUrl, width: 80, class: 'max-h-20 max-w-full object-contain'})
        : h('video', {
          src: block.previewUrl,
          controls: true,
          class: 'block max-h-20 w-full max-w-full object-contain',
        }),
      h('div', {class: 'mt-1 flex items-center gap-2'}, [
        block.status === 'uploading' ? h(Tag, {color: 'processing'}, () => '上传中') : null,
        block.status === 'error' ? h(Tag, {color: 'error'}, () => block.error) : null,
        'key' in item && item.key
          ? h('button', {
            type: 'button',
            class: 'text-xs text-error cursor-pointer',
            onClick: () => activeSenderRef && removeDraftSlot(activeSenderRef, item.key!),
          }, () => '删除')
          : null,
      ]),
    ])
  }

  function renderFilesSlot(
    value: ImCustomSlotValue,
    _onChange: (v: ImCustomSlotValue) => void,
    _props: { disabled?: boolean; readOnly?: boolean },
    item: SlotConfigType,
  ) {
    const block = value as DraftFilesBlock
    draftStore[block.id] = block
    return h('div', {class: 'block w-full my-1'}, [
      h('div', {class: 'flex flex-wrap gap-1 items-center'}, [
        ...block.items.map((fileItem) => h(Tag, {
          key: fileItem.id,
          closable: true,
          onClose: (e: Event) => {
            e.preventDefault()
            if (activeSenderRef && 'key' in item && item.key) {
              removeFileFromGroup(activeSenderRef, item.key, fileItem.id)
            }
          },
        }, () => fileItem.fileName)),
        'key' in item && item.key
          ? h('button', {
            type: 'button',
            class: 'text-xs text-error cursor-pointer ml-1',
            onClick: () => activeSenderRef && removeDraftSlot(activeSenderRef, item.key!),
          }, () => '删除')
          : null,
      ]),
    ])
  }

  function createMediaSlot(block: DraftMediaBlock): SlotConfigType {
    draftStore[block.id] = block
    const kind: ImSlotKind = block.type
    return {
      type: 'custom',
      key: block.id,
      props: {slotKind: kind, defaultValue: block},
      formatResult: () => '',
      customRender: (value, onChange, props, item) => renderMediaSlot(value, onChange, props, item),
    }
  }

  function createFilesSlot(block: DraftFilesBlock): SlotConfigType {
    draftStore[block.id] = block
    return {
      type: 'custom',
      key: block.id,
      props: {slotKind: 'files', defaultValue: block},
      formatResult: () => '',
      customRender: (value, onChange, props, item) => renderFilesSlot(value, onChange, props, item),
    }
  }

  function serializeSlots(senderRef: SenderRef): SlotConfigType[] {
    const result: SlotConfigType[] = []
    for (const slot of senderRef.getValue().slotConfig ?? []) {
      if (slot.type === 'content') {
        continue
      }
      if (slot.type === 'text') {
        result.push({type: 'text', value: slotTextRaw(slot)})
        continue
      }
      if (slot.type === 'custom' && slot.key && draftStore[slot.key]) {
        const draft = draftStore[slot.key]!
        if (draft.type === 'image' || draft.type === 'video') result.push(createMediaSlot(draft))
        else if (draft.type === 'files') result.push(createFilesSlot(draft))
      }
    }
    return stripTrailingEmptyText(result)
  }

  function focusTypingEnd(senderRef: SenderRef) {
    senderRef.focus({cursor: 'end'})
  }

  function appendTypingAnchor(senderRef: SenderRef) {
    const slots = senderRef.getValue().slotConfig ?? []
    const last = slots[slots.length - 1]
    if (last?.type === 'text' && isAnchorOrEmptyText(slotTextRaw(last))) {
      focusTypingEnd(senderRef)
      return
    }
    senderRef.insert([{type: 'text', value: TYPING_ANCHOR}], 'end')
    focusTypingEnd(senderRef)
  }

  function applySlots(senderRef: SenderRef, slots: SlotConfigType[]) {
    const finalSlots = withTypingTail(slots)
    senderRef.clear()
    if (finalSlots.length > 0) senderRef.insert(finalSlots, 'start')
    focusTypingEnd(senderRef)
  }

  function removeDraftSlot(senderRef: SenderRef, key: string) {
    const draft = draftStore[key]
    if (draft?.type === 'image' || draft?.type === 'video') {
      if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl)
    }
    delete draftStore[key]
    applySlots(senderRef, serializeSlots(senderRef).filter((s) => s.key !== key))
  }

  function bindSenderRef(senderRef: SenderRef) {
    activeSenderRef = senderRef
  }

  function findLastFilesKey(slots: SlotConfigType[]): string | undefined {
    for (let i = slots.length - 1; i >= 0; i--) {
      const slot = slots[i]
      if (slot?.type === 'custom' && slot.key && draftStore[slot.key]?.type === 'files') {
        return slot.key
      }
    }
    return undefined
  }

  function slotTextValue(slot: SlotConfigType): string {
    return meaningfulText(slotTextRaw(slot))
  }

  function slotConfigToDraftBlocks(slots: SlotConfigType[]): DraftBlock[] {
    const blocks: DraftBlock[] = []
    for (const slot of stripTrailingEmptyText(slots)) {
      if (slot.type === 'text') {
        const text = slotTextValue(slot)
        if (text) blocks.push({id: uid(), type: 'text', segments: [{type: 'plain', text}]})
      } else if (slot.type === 'custom' && slot.key && draftStore[slot.key]) {
        blocks.push(draftStore[slot.key]!)
      }
    }
    return blocks
  }

  function insertMediaFiles(senderRef: SenderRef, fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) {
      return
    }
    bindSenderRef(senderRef)
    const slots = serializeSlots(senderRef)
    let needRebuild = false
    const toInsert: SlotConfigType[] = []
    for (const file of files) {
      const mediaType = detectMediaType(file)
      if (mediaType === 'image' || mediaType === 'video') {
        const slot = createMediaSlot(createDraftMediaBlock(file, mediaType))
        toInsert.push(slot)
        slots.push(slot)
        continue
      }
      const lastKey = findLastFilesKey(slots)
      const lastSlot = slots[slots.length - 1]
      if (lastKey && lastSlot?.key === lastKey) {
        const block = draftStore[lastKey] as DraftFilesBlock
        block.items.push(createDraftFileItem(file))
        const idx = slots.findIndex((s) => s.key === lastKey)
        if (idx >= 0) slots[idx] = createFilesSlot(block)
        needRebuild = true
      } else {
        const slot = createFilesSlot(createDraftFilesBlock(file))
        toInsert.push(slot)
        slots.push(slot)
      }
    }
    if (needRebuild) applySlots(senderRef, slots)
    else if (toInsert.length > 0) {
      senderRef.insert([{type: 'text', value: '\n'}, ...toInsert], 'end')
    }
    appendTypingAnchor(senderRef)
    touchSlots()
  }

  function removeFileFromGroup(senderRef: SenderRef, blockKey: string, itemId: string) {
    bindSenderRef(senderRef)
    const block = draftStore[blockKey]
    if (!block || block.type !== 'files') return
    block.items = block.items.filter((item) => item.id !== itemId)
    if (block.items.length === 0) {
      removeDraftSlot(senderRef, blockKey)
      return
    }
    applySlots(senderRef, serializeSlots(senderRef))
  }

  async function uploadDraftFileItem(item: DraftFileItem): Promise<ObjectWriteResult> {
    const service = new AttachmentService()
    item.status = 'uploading'
    uploading.value = true
    try {
      const result = await uploadFile(service, toUploadFile(item.localFile), UPLOAD_BUCKET, UPLOAD_OPTIONS)
      item.status = 'done'
      item.result = result
      return result
    } catch (e) {
      item.status = 'error'
      item.error = e instanceof Error ? e.message : '上传失败'
      throw e
    } finally {
      uploading.value = false
    }
  }

  async function uploadDraftMediaBlock(block: DraftMediaBlock): Promise<ObjectWriteResult> {
    const service = new AttachmentService()
    block.status = 'uploading'
    uploading.value = true
    try {
      const result = await uploadFile(service, toUploadFile(block.localFile), UPLOAD_BUCKET, UPLOAD_OPTIONS)
      block.status = 'done'
      block.result = result
      return result
    } catch (e) {
      block.status = 'error'
      block.error = e instanceof Error ? e.message : '上传失败'
      throw e
    } finally {
      uploading.value = false
    }
  }

  async function draftBlockToContentBlock(block: DraftBlock): Promise<ChatContentBlock | null> {
    if (block.type === 'text') {
      const text = segmentsToPlainText(block.segments).trim()
      if (!text) return null
      return {type: 'text', segments: block.segments}
    }
    if (block.type === 'image' || block.type === 'video') {
      const result = block.result ?? await uploadDraftMediaBlock(block)
      return {type: block.type, file: result}
    }
    if (block.type !== 'files') return null
    const files: ObjectWriteResult[] = []
    for (const item of block.items) {
      files.push(item.result ?? await uploadDraftFileItem(item))
    }
    if (files.length === 0) return null
    return {type: 'files', files}
  }

  async function buildMessageContent(senderRef: SenderRef, slotConfig?: SlotConfigType[]): Promise<ChatMessageContent | null> {
    const slots = slotConfig ?? senderRef.getValue().slotConfig ?? []
    const draftBlocks = slotConfigToDraftBlocks(slots)
    if (draftBlocks.length === 0) return null
    const contentBlocks: ChatContentBlock[] = []
    for (const block of draftBlocks) {
      const converted = await draftBlockToContentBlock(block)
      if (converted) contentBlocks.push(converted)
    }
    if (contentBlocks.length === 0) return null
    return {type: 'composite', version: 1, blocks: contentBlocks}
  }

  const slotRevision = ref(0)

  function touchSlots() {
    slotRevision.value++
  }

  function canSend(senderRef: SenderRef): boolean {
    void slotRevision.value
    if (sending.value || uploading.value) return false
    const slots = senderRef.getValue().slotConfig ?? []
    return slotConfigToDraftBlocks(slots).length > 0
  }

  function reset(senderRef: SenderRef) {
    for (const draft of Object.values(draftStore)) {
      if ((draft.type === 'image' || draft.type === 'video') && draft.previewUrl) {
        URL.revokeObjectURL(draft.previewUrl)
      }
    }
    for (const key of Object.keys(draftStore)) delete draftStore[key]
    senderRef.clear()
    senderRef.focus({cursor: 'end'})
  }

  return {
    sending,
    uploading,
    bindSenderRef,
    touchSlots,
    insertMediaFiles,
    buildMessageContent,
    reset,
    canSend,
    segmentsToPlainText,
  }
}
