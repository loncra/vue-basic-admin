<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {AgentChat as LAgent, type AgentSession} from '@loncra/antdv-chat-pro'
import {AgentService} from '@loncra/client/ai'
import {getConversationRuns, useAgentStream} from '@/composables'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {DataLoadingCard as LDataLoadingCard} from '@loncra/antdv-pro'

defineOptions({
  name: 'CommonAiAgent',
})

const current = ref<AgentSession>()
const stream = useAgentStream(() => current.value)
const principalStore = usePrincipalStore()

function onActive(session?: AgentSession) {
  stream.disconnectIfRunning()
  current.value = session
  for (const run of getConversationRuns(session as AgentSession)) {
    stream.connect(Number(run.id), false)
  }
}

function onResume(assistantMessageId: number) {
  stream.connect(assistantMessageId, false)
}

async function onCancel(session: AgentSession) {
  for (const run of getConversationRuns(session)) {
    await AgentService.interrupt(Number(run.key))
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
      <template #extra>{{ current?.name ?? '' }}</template>
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
