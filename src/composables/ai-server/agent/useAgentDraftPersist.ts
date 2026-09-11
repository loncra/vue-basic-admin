import {
  type ComponentInternalInstance,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  type Ref,
  watch,
} from 'vue'
import {debounce} from 'lodash-es'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {ActiveAgentConversationItem, ChatContentBlock} from '@/types/composables'
import {
  clearDraft,
  createAgentDraftCodec,
  getDraft,
  putDraft,
} from '@/composables/chat/draft'
import {createInstructionSlot, requireNonNullOrUndefined} from '@/utils'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'

const PERSIST_DEBOUNCE_MS = 400

export type AgentDraftSenderExpose = {
  getSlotConfigValue: () => SlotConfigType[] | undefined
}

function isPlaceholderDraft(slots: SlotConfigType[] | ChatContentBlock[] | undefined): boolean {
  if (!slots?.length) {
    return true
  }
  // 仅空白 text 视为空；有 /mcp /skill 芯片不能被 IDB 覆盖掉。
  return slots.every(
    (slot) => slot.type === 'text' && !String((slot as {value?: string}).value ?? '').trim(),
  )
}

function asSlotConfig(slots: SlotConfigType[] | ChatContentBlock[] | undefined): SlotConfigType[] {
  return (slots ?? []) as SlotConfigType[]
}

/**
 * Agent 草稿接到同一套 Dexie。内存模型仍是 `AgentConversationItem.draft`（切会话必须写回列表项，
 * 不能只写 Active：activate 会 spread 成新对象）。
 *
 * AgentView 可能后于 activateConversation 才挂载（先切会话再打开 agentView），
 * 所以用 watch(id) + immediate 做 hydrate，不能只靠 view.hydrateSenderDraft。
 */
export function useAgentDraftPersist(options: {
  senderRef: Ref<AgentDraftSenderExpose | null | undefined>
  conversationActive: Ref<ActiveAgentConversationItem | undefined>
  applyDraft: (slots: SlotConfigType[]) => void
}) {
  const {senderRef, conversationActive, applyDraft} = options
  const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  )
  const configProviderStore = useConfigProviderStore()
  const principalStore = usePrincipalStore()

  // 同 IM：hydrate 写回会触发 @change，期间禁止 putDraft。
  let hydrating = false

  function getPrincipal(): string | undefined {
    const name = principalStore.state.name
    return name ? name : undefined
  }

  function getTargetId(): string | undefined {
    const id = conversationActive.value?.id
    return id == null ? undefined : String(id)
  }

  function getCodec() {
    // 点名芯片要现做 customRender；不能把函数写进 IDB。
    return createAgentDraftCodec({
      restoreInstructionSlot: (block) =>
        createInstructionSlot(block, configProviderStore, currentInstance),
    })
  }

  function currentLive(): SlotConfigType[] {
    // Sender 优先；View 正在卸时退回内存 draft。
    return (
      senderRef.value?.getSlotConfigValue() ?? asSlotConfig(conversationActive.value?.draft)
    )
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
    const active = conversationActive.value
    if (!principal || !targetId || !active) {
      return
    }
    hydrating = true
    try {
      const stored = await getDraft('agent', principal, targetId)
      if (!stored || stored.record.scope !== 'agent') {
        return
      }
      if (!isPlaceholderDraft(active.draft)) {
        // 本会话已有内存稿（切走再切回）不以 IDB 覆盖，避免把正在编辑的内容打回磁盘旧版。
        return
      }
      const live = getCodec().fromRecord(stored.record, stored.blobs)
      applyDraft(live)
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
    await clearDraft('agent', principal, targetId)
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      void persistSenderDraft()
    }
  }

  function onBeforeUnload(): void {
    void persistSenderDraft()
  }

  watch(
    () => conversationActive.value?.id,
    async () => {
      // activate 常在 AgentView 挂载前跑完；id 一变（含首次）就 hydrate。
      await hydrateSenderDraft()
    },
    {immediate: true},
  )

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  // View 卸载早于 id watch 收尾；先刷盘，避免切走 agentView 丢最后一次输入。
  onBeforeUnmount(() => {
    persistDebounced.cancel()
    void persistSenderDraft()
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('beforeunload', onBeforeUnload)
  })

  return {
    persistSenderDraft,
    hydrateSenderDraft,
    schedulePersist,
    clearPersistedDraft,
  }
}
