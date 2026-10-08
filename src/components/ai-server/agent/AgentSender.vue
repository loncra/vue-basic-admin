<script setup lang="ts">

import {
  AgentSender as LAgentChatSender,
  type AgentSenderChoice,
  type AgentSenderWorkspace,
  type DraftBinding,
} from '@loncra/antdv-chat'
import type {DraftRestoreResult} from '@loncra/chat-core'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {useAgentSender} from "@/composables";
import type {MenuInfo} from "@v-c/menu";
import type {AgentSenderFormProps} from "@/types/composables";
import type {IdValueMetadata} from "@loncra/client/commons";
import {AGENT_INSTRUCTION_PREFIX} from '@/constants';
import {computed, type ComponentInternalInstance, getCurrentInstance} from 'vue'
import {createAgentDraftCodec, clearDraft, getDraft, putDraft} from '@/composables/chat/draft'
import {createInstructionSlot as buildInstructionSlot, requireNonNullOrUndefined} from '@/utils'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'

defineOptions({
  name: 'LAgentSenderHost',
  inheritAttrs: false,
})

const props = defineProps<{
  /** 本实例对应的会话。key 重建后旧实例仍读自己的 id。 */
  targetId: string
}>()

const emits = defineEmits<{
  submit: [value: AgentSenderFormProps],
  cancel:[]
  change: [value: string, event?: Event, slotConfig?: SlotConfigType[]]
  appliedSlots: [slots: SlotConfigType[]]
}>()

const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()

function principalName(): string | undefined {
  const name = principalStore.state.name
  return name ? name : undefined
}

function draftCodec() {
  return createAgentDraftCodec({
    restoreInstructionSlot: (block) =>
      buildInstructionSlot(block, configProviderStore, currentInstance),
  })
}

const binding: DraftBinding<SlotConfigType[]> = {
  key: () => {
    const principal = principalName()
    return principal && props.targetId ? `${principal}:agent:${props.targetId}` : undefined
  },
  async save(live) {
    const principal = principalName()
    if (!principal || !props.targetId) {
      return
    }
    const codec = draftCodec()
    await putDraft(codec.toRecord(live, {principal, targetId: props.targetId}), codec.collectBlobs(live))
  },
  async load() {
    const principal = principalName()
    if (!principal || !props.targetId) {
      return null
    }
    const stored = await getDraft('agent', principal, props.targetId)
    if (!stored || stored.record.scope !== 'agent') {
      return null
    }
    return draftCodec().fromRecord(stored.record, stored.blobs)
  },
  async clear() {
    const principal = principalName()
    if (!principal || !props.targetId) {
      return
    }
    await clearDraft('agent', principal, props.targetId)
  },
}

function readLive(): SlotConfigType[] {
  return senderRef.value?.getSlotConfigValue() ?? []
}

function slotsOf(live: unknown): SlotConfigType[] {
  return live as SlotConfigType[]
}

function onRestore(result: DraftRestoreResult<unknown, SlotConfigType[]>): void {
  if (result.applySlots && result.slots) {
    emits('appliedSlots', result.slots)
  }
}

const {
  senderRef,
  currentModel,
  isRunning,
  state,
  handleSubmit,
  handleCancel,
  workspaceOptions,
  currentType,
  instructionMap,
  plusMenuItems,
  filterInstruction,
  onPlusMenuClick,
  toCatalogMenuItems,
  findCatalogItem,
  createInstructionSlot,
  senderInsertInstruction,
} = useAgentSender({
  onSubmit:(form:AgentSenderFormProps) => emits("submit", form),
  onCancel:() => emits("cancel"),
})

const globalProperties = currentInstance.appContext.config.globalProperties

const workspaceView = computed<AgentSenderWorkspace | undefined>(() => {
  const options = workspaceOptions.value
  if (!options) {
    return undefined
  }
  return {
    title: `${globalProperties.$t('agent.workspace.title')}: ${options.label}`,
    color: options.color,
    variant: 'outlined',
    icon: options.icon,
  }
})

const modelView = computed<AgentSenderChoice | undefined>(() => {
  if (!currentModel.value) {
    return undefined
  }
  return {
    label: `${currentModel.value.manufacturer.name}:${currentModel.value.name}`,
    items: state.value.modelOptions,
    selectedKeys: [String(currentModel.value.id)],
  }
})

const typeView = computed<AgentSenderChoice>(() => ({
  label: currentType.value?.data?.value,
  color: currentType.value.color,
  items: state.value.typeOptions,
  selectedKeys: [String(currentType.value?.data?.id ?? '')],
}))

function onCatalogClick(
  key: string | number,
  pick: (item: IdValueMetadata<string, string>) => void,
): void {
  const option = findCatalogItem(key)
  if (option) {
    pick(option)
  }
}

function onPlusKey(key: string | number): void {
  onPlusMenuClick({key} as MenuInfo)
}

defineExpose({
  clear:() => senderRef?.value?.clear(),
  getSlotConfigValue:() => senderRef?.value?.getSlotConfigValue(),
  flush: () => senderRef.value?.flush() ?? Promise.resolve(),
  clearStored: () => senderRef.value?.clearStored() ?? Promise.resolve(),
})

</script>

<template>
  <!-- 输入区样式钩子：宿主的 .chat-sender-input 靠 InstructionSender 的 inputClass 默认值注入 -->
  <l-agent-chat-sender
    ref="senderRef"
    v-bind="$attrs"
    :binding="binding"
    :read-live="readLive"
    :slots-of="slotsOf"
    :on-restore="onRestore"
    :placeholder="$t('agent.view.placeholder')"
    :instruction-map="instructionMap"
    :on-filter-data-source="filterInstruction"
    :sender-insert-instruction="senderInsertInstruction"
    :create-instruction-slot="createInstructionSlot"
    :is-running="isRunning"
    :workspace="workspaceView"
    :catalog-prefix="AGENT_INSTRUCTION_PREFIX.TRIGGER"
    :to-catalog-menu-items="toCatalogMenuItems"
    :on-catalog-click="onCatalogClick"
    :plus-items="plusMenuItems"
    :on-plus-click="onPlusKey"
    :model="modelView"
    :type-choice="typeView"
    :on-model-click="(key: string | number) => state.form.modelId = Number(key)"
    :on-type-click="(key: string | number) => state.form.type = Number(key)"
    @change="(value: string, event: Event | undefined, slotConfig: SlotConfigType[] | undefined) => emits('change', value, event, slotConfig)"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <template #plusIcon>
      <icon-font type="loncra-plus"/>
    </template>
    <template v-if="currentModel" #modelIcon>
      <icon-font :type="currentModel.icon || 'loncra-sticker'" />
    </template>
    <template #typeIcon>
      <icon-font :type="currentType.icon" />
    </template>
  </l-agent-chat-sender>
</template>
