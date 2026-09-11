import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  markRaw,
  ref,
  unref
} from 'vue'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
  AttachmentBlock,
  ChatContentBlock,
  FilesSlotProps,
  InstructionBlock,
  ReferenceBlock,
  UseChatMessageSenderParams,
} from '@/types/composables'
import {XProvider as AxConfigProvider} from '@antdv-next/x'
import LAttachmentUpload from '@/components/attachment/AttachmentUpload.vue'
import type {
  AttachmentUploadExecutorOptions,
  AttachmentUploadExpose,
  AttachmentValue,
} from '@/types/composables/attachmentUpload.ts'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {
  convertUploadFiles,
  createInstructionSlot,
  isObjectWriteResult,
  isUploadFile,
  requireNonNullOrUndefined
} from '@/utils'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import type {ObjectWriteResult} from '@/types/apis'
import {isInstructionSlot} from "@/composables/chat/useInstructionSender.ts";
import {
  uploadFile as uploadAttachmentFile
} from '@/composables/attachment/useAttachmentUploadExecutor.ts'

/**
 * 发送器逻辑：files 词槽创建/渲染/上传、粘贴文件、提交组装（附件 + 引用）、
 * 草稿与内容块互转、清空。
 *
 * 刷新还原后芯片能显示、点发送却不 upload：根因是只信 uploadRefMap。
 * 提交时先补 originFileObj，ref 缺失或 upload() 为空再走 uploadFilesDirect。
 */
export function useChatMessageSender(params: UseChatMessageSenderParams) {
  const {sending, refMessages, getUploadOptions, onSubmit: emitSubmit, getSender} = params
  const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
  const configProviderStore = useConfigProviderStore()

  const uploadRefMap = new Map<string, AttachmentUploadExpose>()
  const uploading = ref<boolean>(false)

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

  // File 进 Vue 响应式会被 Proxy，发送时对不上原 File；粘贴 / hydrate 都走 markRaw。
  function toUploadFile(file: File): UploadFile<ObjectWriteResult> {
    return markRaw({
      uid: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      originFileObj: markRaw(file) as UploadFile<ObjectWriteResult>['originFileObj'],
    })
  }

  function originBlob(file: UploadFile<ObjectWriteResult>): Blob | undefined {
    const origin = file.originFileObj
    return origin instanceof Blob ? origin : undefined
  }

  // 刷新还原后 File 在 props.defaultValue；运行中组件也可能写到 slot.value。同 uid 优先带 originFileObj 的那份。
  function filesFromSlot(slot: SlotConfigType & {props: FilesSlotProps}): UploadFile<ObjectWriteResult>[] {
    const fromProps = (slot.props.defaultValue ?? []).filter(isUploadFile)
    const extra = (slot as {value?: unknown}).value
    const fromValue = Array.isArray(extra) ? extra.filter(isUploadFile) : []
    const merged = new Map<string, UploadFile<ObjectWriteResult>>()
    for (const file of [...fromValue, ...fromProps]) {
      const uid = String(file.uid)
      const prev = merged.get(uid)
      if (!prev || (!originBlob(prev) && originBlob(file))) {
        merged.set(uid, file)
      }
    }
    return [...merged.values()]
  }

  // AttachmentUpload 内部列表可能丢了 originFileObj；用槽里还原的 File 补回去，upload() 才能读到二进制。
  function repairOrigin(
    files: UploadFile<ObjectWriteResult>[],
    source: UploadFile<ObjectWriteResult>[],
  ): void {
    const byUid = new Map(source.map((file) => [String(file.uid), file]))
    for (const file of files) {
      if (originBlob(file)) {
        continue
      }
      const src = byUid.get(String(file.uid))
      const origin = src ? originBlob(src) : undefined
      if (origin) {
        file.originFileObj = origin as UploadFile<ObjectWriteResult>['originFileObj']
      }
    }
  }

  function buildChatUploadOptions(): AttachmentUploadExecutorOptions {
    const raw = getUploadOptions() ?? {}
    return {
      postFilename: 'file',
      promiseLimit: 3,
      param: (raw.param ?? {}) as Record<string, unknown>,
      headers: (raw.headers ?? {}) as Record<string, string>,
    }
  }

  // Dexie hydrate 后 uploadRefMap 可能还没挂上，或 upload() 得到空结果；直接用槽里的 File 走同一套分片上传。
  async function uploadFilesDirect(
    files: UploadFile<ObjectWriteResult>[],
  ): Promise<ObjectWriteResult[]> {
    const options = buildChatUploadOptions()
    const results: ObjectWriteResult[] = []
    for (const file of files) {
      if (isObjectWriteResult(file.response) && file.status === 'done') {
        results.push(file.response)
        continue
      }
      if (!originBlob(file)) {
        continue
      }
      results.push(await uploadAttachmentFile(file, 'temp', options))
    }
    return results
  }

  function asWriteResults(
    uploaded: ObjectWriteResult | ObjectWriteResult[] | undefined,
  ): ObjectWriteResult[] {
    return (Array.isArray(uploaded) ? uploaded : uploaded ? [uploaded] : []).filter(
      (file): file is ObjectWriteResult => isObjectWriteResult(file),
    )
  }

  function resolveFilesValue(
    value: unknown,
    item: SlotConfigType,
  ): UploadFile<ObjectWriteResult>[] {
    if (Array.isArray(value) && value.some(isUploadFile)) {
      return value.filter(isUploadFile)
    }
    if (item.type === 'custom' && Array.isArray(item.props?.defaultValue)) {
      return item.props.defaultValue.filter(isUploadFile)
    }
    return []
  }

  function fileCustomRender(
    value: UploadFile<ObjectWriteResult>[],
    onChange: (value: AttachmentValue) => void,
    _props: {disabled?: boolean; readOnly?: boolean},
    item: SlotConfigType,
  ) {
    const slotKey = 'key' in item && item.key ? item.key : ''
    const files = resolveFilesValue(value, item)
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
            value: files,
            multiple: true,
            maxCount: files.length,
            'onUpdate:value': (next: AttachmentValue) => handleFilesSlotChange(item, next, onChange),
          }),
      },
    )
    node.appContext = currentInstance.appContext
    return node
  }

  // hydrate 必须走这个工厂：customRender 闭包才能把芯片绑进本实例的 uploadRefMap。
  function createFilesSlot(
    files: UploadFile<ObjectWriteResult>[],
    key: string = crypto.randomUUID(),
  ): SlotConfigType {
    return markRaw({
      type: 'custom',
      key,
      props: {slotKind: 'files', defaultValue: files.map((file) => markRaw(file))},
      customRender: fileCustomRender,
    })
  }

  function handleFilesSlotChange(
    item: SlotConfigType,
    next: AttachmentValue,
    senderOnChange: (value: AttachmentValue) => void,
  ): void {
    const files = Array.isArray(next) ? next : next ? [next] : []
    const sender = getSender()
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
    const sender = getSender()
    if (!sender) {
      return
    }
    sender.insert([slot], 'cursor')
  }

  async function handleSubmit(
    value: string,
    _slotConfig?: SlotConfigType[]
  ): Promise<void> {
    if (!_slotConfig?.length) {
      return
    }
    uploading.value = true
    try {
      const blocks: ChatContentBlock[] = []
      // 不能只信 uploadRefMap：刷新后芯片能显示，ref 却可能未绑上，点发送会只出文字、不 upload。
      for (const slot of _slotConfig) {
        if (isFilesSlot(slot) && slot.key) {
          const slotFiles = filesFromSlot(slot)
          const inst = uploadRefMap.get(slot.key)
          const live = inst?.getFiles?.()?.filter(isUploadFile)
          let files: ObjectWriteResult[] = []
          if (inst && live) {
            if (live.length > 0) {
              repairOrigin(live, slotFiles)
              files = asWriteResults(await inst.upload())
              if (files.length === 0) {
                files = await uploadFilesDirect(live)
              }
            }
          } else {
            files = asWriteResults(await inst?.upload())
            if (files.length === 0) {
              files = await uploadFilesDirect(slotFiles)
            }
          }
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
    getSender()?.insert([{type: 'text', value: emoji}], 'cursor')
  }

  function clear(): void {
    const sender = getSender()
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
    return getSender()?.getValue()?.slotConfig || []
  }

  return {
    isSending,
    onPasteFiles,
    handleSubmit,
    onSelectedEmoji,
    clear,
    convertContentBlockToSlotConfig,
    getSlotConfigValue,
    createFilesSlot,
  }
}

export type ChatMessageSenderApi = ReturnType<typeof useChatMessageSender>
