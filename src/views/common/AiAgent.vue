<script setup lang="ts">
import {onMounted} from 'vue'
import {AgentChat} from '@loncra/antdv-chat-pro'
import {buildAuthHeaders} from '@/requests'
import {usePrincipalStore} from '@/stores/principalStore.ts'

defineOptions({
  name: 'CommonAiAgent',
})

const principalStore = usePrincipalStore()

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
      @installed="principalStore.upsertPluginInstall"
      @uninstalled="principalStore.removePluginInstall"
    >
      <template #agentAvatar>
        <icon-font type="icon-xiaojiage-a" />
      </template>
    </agent-chat>
  </div>
</template>
