<script setup lang="ts">
import {onMounted} from 'vue'
import {AgentChat} from '@loncra/antdv-chat-pro'
import {buildAuthHeaders} from '@/requests'
import {agentConversationHost} from '@/utils/agentWorkspace'
import {usePrincipalStore} from '@/stores/principalStore.ts'

defineOptions({
  name: 'CommonAiAgent',
})

const principalStore = usePrincipalStore()

const conversationHost = {
  ...agentConversationHost,
  onWorkspaceRemoved: () => {
    void principalStore.loadPluginInstalls()
  },
}

onMounted(() => {
  void principalStore.loadPluginInstalls()
})
</script>

<template>
  <div class="h-full min-h-120">
    <agent-chat
      :installs="principalStore.pluginInstalls"
      :self="{
        ...principalStore.state.details.metadata,
        systemName: principalStore.state.name,
        type: principalStore.state.type,
        grantedAuthorities: principalStore.state.grantedAuthorities,
      }"
      :build-headers="buildAuthHeaders"
      :conversation-host="conversationHost"
      @installed="() => principalStore.loadPluginInstalls()"
      @uninstalled="principalStore.removePluginInstall"
    >
      <template #agentAvatar>
        <icon-font type="icon-xiaojiage-a" />
      </template>
    </agent-chat>
  </div>
</template>
