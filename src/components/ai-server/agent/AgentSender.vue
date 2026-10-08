<script setup lang="ts">

import {
  DraftSender as LDraftSender,
  type DraftBinding,
} from '@loncra/antdv-chat'
import type {DraftRestoreResult} from '@loncra/chat-core'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {useAgentSender} from "@/composables";
import type {MenuInfo} from "@v-c/menu";
import type {AgentSenderFormProps} from "@/types/composables";
import type {IdValueMetadata} from "@loncra/client/commons";
import {AGENT_INSTRUCTION_PREFIX} from '@/constants';
import {type ComponentInternalInstance, getCurrentInstance} from 'vue'
import {createAgentDraftCodec, clearDraft, getDraft, putDraft} from '@/composables/chat/draft'
import {createInstructionSlot as buildInstructionSlot, requireNonNullOrUndefined} from '@/utils'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'

defineOptions({
  name: 'LAgentSender',
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

function slashSelectedKeys(
  items: IdValueMetadata<string, string>[],
  activeIndex: number,
): string[] {
  const item = items[activeIndex]
  const group = item?.metadata?.group
  if (!item || typeof group !== 'string' || !group) {
    return []
  }
  return [group + ':' + item.id]
}

function onSlashMenuClick(
  info: MenuInfo,
  pick: (item: IdValueMetadata<string, string>) => void,
): void {
  const option = findCatalogItem(info.key)
  if (option) {
    pick(option)
  }
}

defineExpose({
  clear:() => senderRef?.value?.clear(),
  getSlotConfigValue:() => senderRef?.value?.getSlotConfigValue(),
  flush: () => senderRef.value?.flush() ?? Promise.resolve(),
  clearStored: () => senderRef.value?.clearStored() ?? Promise.resolve(),
})

</script>

<template>
  <!-- 输入区样式钩子：宿主的 .chat-sender-input（assets/style.css 那两条规则）靠官方 classes.input 注入；包内不再兜这个类名 -->
  <l-draft-sender
    ref="senderRef"
    :binding="binding"
    :read-live="readLive"
    :slots-of="slotsOf"
    :on-restore="onRestore"
    :placeholder="$t('agent.view.placeholder')"
    :instruction-map="instructionMap"
    :on-filter-data-source="filterInstruction"
    :sender-insert-instruction="senderInsertInstruction"
    :create-instruction-slot="createInstructionSlot"
    :classes="{input: 'chat-sender-input'}"
    v-bind="$attrs"
    @change="(value, event, slotConfig) => emits('change', value, event, slotConfig)"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <template #header v-if="workspaceOptions">
      <ax-sender-header title=" " :closable="false" open>
        <template #title>
          <a-tag v-bind="workspaceOptions">
            {{$t('agent.workspace.title')}}: {{workspaceOptions.label}}
          </a-tag>
        </template>
      </ax-sender-header>
    </template>
    <template #instructionListRender="{items, prefix, activeIndex, pick}">
      <a-menu
        v-if="prefix === AGENT_INSTRUCTION_PREFIX.TRIGGER"
        class="border-0! bg-transparent! min-w-44"
        :items="toCatalogMenuItems(items)"
        :selectable="false"
        :selected-keys="slashSelectedKeys(items, activeIndex)"
        @click="(info: MenuInfo) => onSlashMenuClick(info, pick)"
      />
    </template>
    <template #defaultButton="{components}">
      <component
        v-if="isRunning"
        :is="components.ClearButton"
        :disabled="false"
        @click="senderRef?.clear()"
      />
      <component
        :is="isRunning ? components.LoadingButton : components.SendButton"
        :disabled="false"
        type="primary"
      />
    </template>
    <template #leftExtra>
      <a-dropdown
        :menu="{ items: plusMenuItems }"
        :trigger="['click']"
        :disabled="plusMenuItems.length === 0 || isRunning"
        placement="topLeft"
        @menu-click="onPlusMenuClick"
      >
        <a-button shape="circle" size="small" :disabled="plusMenuItems.length === 0 || isRunning">
          <template #icon>
            <icon-font type="loncra-plus"/>
          </template>
        </a-button>
      </a-dropdown>
      <a-dropdown v-if="currentModel" @menu-click="(info:MenuInfo) => state.form.modelId = Number(info.key)" :menu="{ selectable: true, items: state.modelOptions, defaultSelectedKeys:[String(currentModel.id)]}">
        <a-button color="primary" variant="outlined" size="small" >
          <template #icon>
            <icon-font :type="currentModel.icon || 'loncra-sticker'" />
          </template>
          {{currentModel.manufacturer.name}}:{{currentModel.name}}
        </a-button>
      </a-dropdown>
      <a-dropdown @menu-click="(info:MenuInfo) => state.form.type = Number(info.key)" :menu="{selectable: true, items: state.typeOptions, defaultSelectedKeys:[String(currentType?.data?.id)]}">
        <a-button :color="currentType.color" variant="dashed" type="text" size="small" >
          <template #icon>
            <icon-font :type="currentType.icon" />
          </template>
          {{currentType?.data?.value}}
        </a-button>
      </a-dropdown>
    </template>
  </l-draft-sender>
</template>
