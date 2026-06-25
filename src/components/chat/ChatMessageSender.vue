<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, h, ref} from "vue";
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {
  AttachmentBlock,
  ChatContentBlock,
  FilesSlotProps,
  ReferenceBlock
} from "@/types/composables";
import {Sender as AxSender, XProvider as AxConfigProvider} from '@antdv-next/x'
import LAttachmentUpload from '@/components/attachment/AttachmentUpload.vue'
import type {
  AttachmentUploadExpose,
  AttachmentValue
} from "@/types/composables/attachmentUpload.ts";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {convertUploadFiles, isObjectWriteResult, requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from '@/stores/configProviderStore'
import type {ObjectWriteResult, UserChatMessageResponseBody} from "@/types/apis";
import LChatMessageReference from "@/components/chat/ChatMessageReference.vue";
import LEmojiButton from "@/components/basic/EmojiButton.vue";

defineOptions({
  name: 'LChatMessageSender',
})

const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())

const configProviderStore = useConfigProviderStore()

const uploadRefMap = new Map<string, AttachmentUploadExpose>()
const senderRef = ref<SenderRef>()

const uploading = ref<boolean>(false)

const sending = defineModel<boolean>("sending", {default: false})
const refMessages = defineModel<UserChatMessageResponseBody[]>("refMessages", {default: () => []})

const props = withDefaults(defineProps<{
  slotConfig?: SlotConfigType[]
  placeholder: string,
  uploadOptions?: Record<string, unknown>,
  disabled: boolean
}>(), {
  slotConfig: () => [],
  placeholder: '',
  uploadBucket: 'system.file',
  disabled: false
})

const emit = defineEmits<{
  submit: [content: ChatContentBlock[]]
  jumpToReference: [body: UserChatMessageResponseBody]
}>()

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

function isFilesSlot(slot: SlotConfigType): slot is SlotConfigType & {
  key: string;
  props: FilesSlotProps
} {
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
) {
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
          bucket: 'temp',
          uploadOptions: props.uploadOptions,
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
  return {algorithm, token: configProviderStore.state.token}
}

function onPasteFiles(fileList: FileList) {
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

async function onSubmit(_message: string, _slotConfig?: SlotConfigType[]) {
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
        const files: ObjectWriteResult[] = (Array.isArray(uploaded) ? uploaded : uploaded ? [uploaded] : [])
          .filter((f): f is ObjectWriteResult => isObjectWriteResult(f))
        const attachmentBlock: AttachmentBlock = {
          files: files,
          type: 'custom',
          slotKind: 'files'
        }
        blocks.push(attachmentBlock)
      }
      blocks.push(slot as ChatContentBlock)
    }
    if (refMessages.value.length > 0) {
      const referenceBlock: ReferenceBlock = {
        type: 'custom',
        slotKind: 'reference',
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

function onSelectedEmoji(emoji: string) {
  senderRef.value?.insert([{type: 'text', value: emoji}], 'cursor')
}

function clear() {
  const sender = senderRef.value
  if (!sender) {
    return
  }
  sender.clear()
  sender.focus({cursor: 'end'})
}

function convertContentBlockToSlotConfig(content:ChatContentBlock[]) {
  const result:SlotConfigType[] = []
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

  return result;
}

defineExpose({
  clear,
  convertContentBlockToSlotConfig,
  getSlotConfigValue:() => senderRef?.value?.getValue()?.slotConfig || []
})

</script>

<template>
  <ax-sender
    ref="senderRef"
    :slot-config="props.disabled ? undefined : props.slotConfig"
    :suffix="false"
    allow-speech
    :disabled="props.disabled"
    :class-names="{
      input: 'chat-sender-input',
      footer:'p-xs! border-t border-t-border-secondary'
    }"
    :loading="uploading || sending"
    @paste-file="onPasteFiles"
    @submit="onSubmit"
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
          <l-emoji-button @selected="onSelectedEmoji" />
        </a-space>
        <a-flex justify="space-between" align="center" gap="small">
          <component :is="components.ClearButton" @click="clear"/>
          <component
            :is="uploading || sending ? components.LoadingButton : components.SendButton"
            type="primary"
          />
        </a-flex>
      </a-flex>
    </template>
  </ax-sender>
</template>
