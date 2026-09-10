<script setup lang="ts">

import LInstructionSender from "@/components/basic/chat/InstructionSender.vue";
import {useAgentSender} from "@/composables";
import type {MenuInfo} from "@v-c/menu";
import type {AgentSenderFormProps} from "@/types/composables";
import type {IdValueMetadata} from "@/types/apis";
import {AGENT_INSTRUCTION_PREFIX} from "@/constants";

import {SenderHeader as AxSenderHeader} from '@antdv-next/x'

defineOptions({
  name: 'LAgentSender',
})

const emits = defineEmits<{
  submit: [value: AgentSenderFormProps],
  cancel:[]
}>()

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
} = useAgentSender({
  onSubmit:(form:AgentSenderFormProps) => emits("submit", form),
  onCancel:() => emits("cancel"),
})

function instructionItemIcon(item: IdValueMetadata<string, string>): string {
  const icon = item.metadata?.icon
  if (typeof icon === 'string' && icon) {
    return icon
  }
  return item.metadata?.group === 'mcp' ? 'loncra-plug-zap' : 'loncra-sparkles'
}

defineExpose({
  clear:() => senderRef?.value?.clear(),
  getSlotConfigValue:() => senderRef?.value?.getSlotConfigValue(),
})

</script>

<template>
  <l-instruction-sender
    ref="senderRef"
    :placeholder="$t('agent.view.placeholder')"
    :instruction-map="instructionMap"
    :filter-instruction="filterInstruction"
    v-bind="$attrs"
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
    <template #instructionItemRender="{item, prefix}">
      <a-space v-if="prefix === AGENT_INSTRUCTION_PREFIX.TRIGGER">
        <icon-font :type="instructionItemIcon(item)"/>
        <a-typography-text :ellipsis="{tooltip: item.value}">
          {{ item.value }}
        </a-typography-text>
      </a-space>
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
  </l-instruction-sender>
</template>
