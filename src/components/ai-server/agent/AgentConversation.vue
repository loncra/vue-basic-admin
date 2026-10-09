<script setup lang="ts">
import {type ComponentInternalInstance, computed, getCurrentInstance} from 'vue'
import {requireNonNullOrUndefined} from '@/utils'
import {ensureConversationDraftTree, useAgentChatContext} from '@/composables'
import {
  AgentConversationList,
  useAgentConversations,
  type AgentConversationActions,
  type AgentConversationHost,
} from '@loncra/antdv-chat-pro'
import type {AgentConversationItem} from '@/types/composables'

defineOptions({
  name: 'LAgentConversation',
})

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const {conversations, menuOptions, activateConversation} = useAgentChatContext()

const emits = defineEmits<{
  buttonClick: [view: string]
}>()

const host = computed<AgentConversationHost>(() => ({
  timeText: (unix) => globalProperties.$dayjs(unix).fromNow(),
  onOpen: (item) => {
    void activateConversation(item as AgentConversationItem)
    emits('buttonClick', 'agentView')
  },
  onOpenPluginMarket: () => emits('buttonClick', 'agentHubView'),
  afterLoad: (items) => ensureConversationDraftTree(items as AgentConversationItem[]),
}))

const {
  loading,
  startCreate,
  startRename,
  cancelEdit,
  confirmEdit,
  remove,
} = useAgentConversations(conversations, host.value)

const actions: AgentConversationActions = {
  startCreate,
  startRename,
  cancelEdit,
  confirmEdit,
  remove,
}

</script>

<template>
  <agent-conversation-list
    :items="conversations"
    :loading="loading"
    :selected-keys="menuOptions.selectedKeys"
    :open-keys="menuOptions.openKeys"
    :host="host"
    :actions="actions"
    @update:selected-keys="(keys: string[]) => menuOptions.selectedKeys = keys"
    @update:open-keys="(keys: string[]) => menuOptions.openKeys = keys"
  />
</template>
