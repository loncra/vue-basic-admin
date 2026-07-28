<script setup lang="ts">

import LInstructionSender from "@/components/basic/chat/InstructionSender.vue";
import {useAgentSender} from "@/composables";
import type {MenuInfo} from "@v-c/menu";
import type {AgentSenderFormProps} from "@/types/composables";

import {SenderHeader as AxSenderHeader} from '@antdv-next/x'
import {AGENT_CONVERSATION_TYPE} from "@/constants";

defineOptions({
  name: 'LAgentSender',
})

const emits = defineEmits<{
  submit: [value: AgentSenderFormProps]
}>()

const {
  senderRef,
  currentModel,
  conversationActive,
  state,
  handleSubmit,
  workspaceOptions,
  currentType,
} = useAgentSender({
  onSubmit:(form:AgentSenderFormProps) => emits("submit", form)
})

defineExpose({
  clear:() => senderRef?.value?.clear(),
  getSlotConfigValue:() => senderRef?.value?.getSlotConfigValue(),
})

</script>

<template>
  <l-instruction-sender
    ref="senderRef"
    :placeholder="$t('agent.view.placeholder')"
    :sending="state.loading || (conversationActive && conversationActive.loading)"
    @submit="handleSubmit"
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
    <template #leftExtra>
      <a-button shape="circle" size="small">
        <template #icon>
          <icon-font type="loncra-plus"/>
        </template>
      </a-button>
      <a-dropdown v-if="currentModel" @menu-click="(info:MenuInfo) => state.form.modelId = Number(info.key)" :menu="{ selectable: true, items: state.modelOptions, defaultSelectedKeys:[String(currentModel.id)]}">
        <a-button color="primary" variant="outlined" size="small" >
          <template #icon>
            <icon-font :type="currentModel.icon || 'loncra-sticker'" />
          </template>
          （{{currentModel.manufacturer.name}}）{{currentModel.name}}
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
