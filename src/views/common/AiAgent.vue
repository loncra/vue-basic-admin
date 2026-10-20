<script setup lang="ts">
import {onMounted} from 'vue'
import {AgentChat as LAgent, type AgentSession, interruptAgent} from '@loncra/antdv-chat-pro'
import {getConversationRuns, useAgentStream} from '@/composables'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {DataLoadingCard as LDataLoadingCard} from '@loncra/antdv-pro'

defineOptions({
  name: 'CommonAiAgent',
})

let current: AgentSession | undefined
const stream = useAgentStream(() => current)
const principalStore = usePrincipalStore()

function onActive(session: AgentSession) {
  stream.disconnectIfRunning()
  current = session
  for (const run of getConversationRuns(session)) {
    stream.connect(Number(run.id), false)
  }
}

function onResume(assistantMessageId: number) {
  stream.connect(assistantMessageId, false)
}

async function onCancel(session: AgentSession) {
  for (const run of getConversationRuns(session)) {
    await interruptAgent(Number(run.key))
  }
}

onMounted(() => {
  void principalStore.loadPluginInstalls()
})
</script>

<template>
  <div class="h-full min-h-120">
    <l-data-loading-card
      :spin="false"
      :classes="{
        card: {
          root:'min-h-0 flex flex-col h-full shadow-ter',
          header: 'shrink-0',
          body:'flex flex-1 min-h-0 p-0! overflow-hidden'
        }
      }"
    >
      <l-agent
        :installs="principalStore.pluginInstalls"
        :self="{...principalStore.state.details.metadata, systemName: principalStore.state.name}"
        @active="onActive"
        @resume="onResume"
        @cancel="onCancel"
        @installed="principalStore.upsertPluginInstall"
        @uninstalled="principalStore.removePluginInstall"
      >
        <template #agentAvatar>
          <icon-font type="icon-xiaojiage-a" />
        </template>
      </l-agent>
    </l-data-loading-card>
  </div>
</template>
