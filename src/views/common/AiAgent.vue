<script setup lang="ts">
import {computed, onMounted} from 'vue'
import type {AgentConversationHost} from '@loncra/antdv-chat-pro'
import {AgentChat} from '@loncra/antdv-chat-pro'
import {buildAuthHeaders} from '@/requests'
import {agentConversationHost} from '@/utils/agentWorkspace'
import {isTauri} from '@/utils/common'
import {usePrincipalStore} from '@/stores/principalStore.ts'

defineOptions({
  name: 'CommonAiAgent',
})

const principalStore = usePrincipalStore()
const conversationHost = computed<Partial<AgentConversationHost> | undefined>(() =>
  isTauri() ? agentConversationHost : undefined,
)

onMounted(() => {
  void principalStore.loadPluginInstalls()
})
</script>

<template>
  <div class="h-full min-h-120">
    <agent-chat
      :installs="principalStore.pluginInstalls"
      :self="{...principalStore.state.details.metadata, systemName: principalStore.state.name}"
      :build-headers="buildAuthHeaders"
      :conversation-host="conversationHost"
      @installed="principalStore.upsertPluginInstall"
      @uninstalled="principalStore.removePluginInstall"
    >
      <template #agentAvatar>
        <icon-font type="icon-xiaojiage-a" />
      </template>
    </agent-chat>
  </div>
</template>
