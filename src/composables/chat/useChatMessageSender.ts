import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  type MaybeRef,
  type Ref,
  ref,
  unref
} from 'vue'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
  AttachmentBlock,
  ChatContentBlock,
  FilesSlotProps,
  InstructionBlock,
  InstructionSlotProps,
  ReferenceBlock,
} from '@/types/composables'
import {XProvider as AxConfigProvider} from '@antdv-next/x'
import LAttachmentUpload from '@/components/attachment/AttachmentUpload.vue'
import type {
  AttachmentUploadExpose,
  AttachmentValue,
} from '@/types/composables/attachmentUpload.ts'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {
  convertUploadFiles,
  createInstructionSlot,
  isObjectWriteResult,
  requireNonNullOrUndefined
} from '@/utils'
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

  function isInstructionSlot(
    slot: SlotConfigType,
  ): slot is SlotConfigType & {key: string; props: InstructionSlotProps} {
    return slot.type === 'custom' && slot.props?.slotKind === 'instruction'
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
        theme: configProviderStore.providerTheme(),
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
            id: slot.key,
            files: files,
            type: 'custom',
            slotKind: 'files',
          }
          blocks.push(attachmentBlock)
        } else if (isInstructionSlot(slot) && slot.key) {
          const instructionBlock: InstructionBlock = {
            id:slot.key,
            value: {id:slot.props.defaultValue.id, value:slot.props.defaultValue.value},
            type: 'custom',
            prefix: slot.props.prefix,
            slotKind: 'instruction',
          }
          blocks.push(instructionBlock)
        } else {
          blocks.push(slot as ChatContentBlock)
        }
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
      } else if (slot.type === 'custom' && slot.slotKind === 'instruction') {
        result.push(createInstructionSlot(slot, configProviderStore, currentInstance))
      }
    }
    return result
  }

  function getSlotConfigValue(): SlotConfigType[] {
    return senderRef.value?.getValue()?.slotConfig || []
  }

  return {
    senderRef,
    isSending,
    onPasteFiles,
    handleSubmit,
    onSelectedEmoji,
    clear,
    convertContentBlockToSlotConfig,
    getSlotConfigValue,
  }
}

export type ChatMessageSenderApi = ReturnType<typeof useChatMessageSender>
