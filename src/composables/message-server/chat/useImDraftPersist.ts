import {
  type ComponentInternalInstance,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  type Ref,
  watch,
} from 'vue'
import {debounce} from 'lodash-es'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {ObjectWriteResult, UserChatMessageResponseBody} from '@/types/apis'
import type {UserChatConversationActiveProps} from '@/types/composables'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {clearDraft, createImDraftCodec, getDraft, putDraft,} from '@/composables/chat/draft'
import {createInstructionSlot, requireNonNullOrUndefined} from '@/utils'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'

const PERSIST_DEBOUNCE_MS = 400

export type ImDraftSenderExpose = {
  createFilesSlot: (
    files: UploadFile<ObjectWriteResult>[],
    key?: string,
  ) => SlotConfigType
  getSlotConfigValue: () => SlotConfigType[]
}

function isPlaceholderDraft(slots: SlotConfigType[] | undefined): boolean {
  if (!slots?.length) {
    return true
  }
  // 仅空白 text 视为空；有附件 / @ 芯片则以内存为准，不用 IDB 覆盖。
  return slots.every((slot) => slot.type === 'text' && !String(slot.value ?? '').trim())
}

/**
 * 把当前输入框接到 Dexie。
 *
 * 内存 `item.data.draft` 仍是活槽（列表「[草稿]」读它）。IDB 只负责刷新后恢复。
 * 切会话：loader 先把 Sender 写回内存再 persist（必须用当时的 roomId）。
 * 输入：防抖写盘，不要把 getSlotConfigValue() 写回绑定中的 slot-config，否则编辑器会整表重建。
 * hydrate：仅当内存是空占位时用 IDB 覆盖；本会话已有输入则以内存为准。引用条没有单独的内存模型，有记录就填回。
 */
export function useImDraftPersist(options: {
  senderRef: Ref<ImDraftSenderExpose | null | undefined>
  conversation: Ref<UserChatConversationActiveProps>
  refMessages: Ref<UserChatMessageResponseBody[]>
}) {
  const {senderRef, conversation, refMessages} = options
  const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  )
  const configProviderStore = useConfigProviderStore()
  const principalStore = usePrincipalStore()

  // hydrate 写回 draft / refMessages 会触发 @change 与 watch，必须跳过写盘，否则刚还原又被空稿盖掉。
  let hydrating = false

  function getPrincipal(): string | undefined {
    const name = principalStore.state.name
    return name ? name : undefined
  }

  function getTargetId(): string | undefined {
    // IM 主键是房间，不是会话 id；同一房间多会话条目共用一份草稿。
    const roomId = conversation.value.item?.data?.room?.id
    return roomId == null ? undefined : String(roomId)
  }

  function getCodec() {
    // 必须用当前 Sender 实例的 createFilesSlot：customRender 闭包里才是这份 uploadRefMap。
    const createFilesSlot = senderRef.value?.createFilesSlot
    return createImDraftCodec({
      restoreFilesSlot: createFilesSlot
        ? (files, key) => createFilesSlot(files, key)
        : undefined,
      restoreInstructionSlot: (block) =>
        createInstructionSlot(block, configProviderStore, currentInstance),
    })
  }

  function currentLive() {
    return {
      slots: senderRef.value?.getSlotConfigValue() ?? conversation.value.item?.data?.draft ?? [],
      refMessages: [...refMessages.value],
    }
  }

  async function persistSenderDraft(): Promise<void> {
    persistDebounced.cancel()
    const principal = getPrincipal()
    const targetId = getTargetId()
    if (!principal || !targetId || hydrating) {
      return
    }
    const live = currentLive()
    const codec = getCodec()
    try {
      await putDraft(codec.toRecord(live, {principal, targetId}), codec.collectBlobs(live))
    } catch {
      // IndexedDB 不可用或单文件超限时不阻断切会话 / 输入
    }
  }

  const persistDebounced = debounce(() => {
    void persistSenderDraft()
  }, PERSIST_DEBOUNCE_MS)

  function schedulePersist(): void {
    if (hydrating) {
      return
    }
    persistDebounced()
  }

  async function hydrateSenderDraft(): Promise<void> {
    persistDebounced.cancel()
    const principal = getPrincipal()
    const targetId = getTargetId()
    const data = conversation.value.item?.data
    if (!principal || !targetId || !data) {
      refMessages.value = []
      return
    }
    hydrating = true
    try {
      const stored = await getDraft('im', principal, targetId)
      if (!stored || stored.record.scope !== 'im') {
        refMessages.value = []
        return
      }
      // Sender 按房间 :key 重建；hydrate 要等新实例的 createFilesSlot，否则芯片没有 customRender。
      for (let i = 0; i < 3 && !senderRef.value?.createFilesSlot; i++) {
        await nextTick()
      }
      const live = getCodec().fromRecord(stored.record, stored.blobs)
      // 内存已有输入则保留；仅占位时用 IDB 覆盖。
      if (isPlaceholderDraft(data.draft)) {
        data.draft = live.slots
      }
      // 引用条不在会话 body 上；有 IDB 记录就按房间填，避免切会话串到上一房间。
      refMessages.value = live.refMessages
    } finally {
      hydrating = false
    }
  }

  async function clearPersistedDraft(): Promise<void> {
    persistDebounced.cancel()
    const principal = getPrincipal()
    const targetId = getTargetId()
    if (!principal || !targetId) {
      return
    }
    await clearDraft('im', principal, targetId)
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      void persistSenderDraft()
    }
  }

  function onBeforeUnload(): void {
    void persistSenderDraft()
  }

  watch(refMessages, schedulePersist, {deep: true})

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('beforeunload', onBeforeUnload)
    persistDebounced.cancel()
    // 离开聊天页时刷盘；切房间由 loader 在换 item 之前 persist。
    void persistSenderDraft()
  })

  return {
    persistSenderDraft,
    hydrateSenderDraft,
    schedulePersist,
    clearPersistedDraft,
  }
}
