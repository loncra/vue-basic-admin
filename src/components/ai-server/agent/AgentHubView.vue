<script setup lang="ts">

import {
  type ComponentInternalInstance,
  computed,
  defineAsyncComponent,
  getCurrentInstance,
  onMounted,
  ref
} from "vue";
import {createIcon, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {AiUserPluginInstallService} from "@/apis";
import type {RestResult, UserPluginInstallResult} from "@/types/apis";

defineOptions({
  name: 'LAgentHubView',
})

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const hubViews = {
  LAgentHubMcp: defineAsyncComponent(
    () => import('@/components/ai-server/agent/hub/McpView.vue'),
  ),
  LAgentHubSkill: defineAsyncComponent(
    () => import('@/components/ai-server/agent/hub/SkillView.vue'),
  ),
  LAgentHubMyPlugin: defineAsyncComponent(
    () => import('@/components/ai-server/agent/hub/MyPluginView.vue'),
  ),
}

const value = ref<keyof typeof hubViews>('LAgentHubMcp')
const installs = ref<UserPluginInstallResult[]>([])

const options = computed(() => [{
  value: 'LAgentHubMcp',
  label: globalProperties.$t('agent.hub.mcp'),
  icon:createIcon('loncra-plug-zap', 'align')
},{
  value: 'LAgentHubSkill',
  label: globalProperties.$t('agent.hub.skill'),
  icon:createIcon('loncra-sparkles', 'align')
},{
  value: 'LAgentHubMyPlugin',
  label: globalProperties.$t('agent.hub.myPlugin'),
  icon:createIcon('loncra-package', 'align')
}])

function onInstalled(result: UserPluginInstallResult) {
  if (result.packageId == null) {
    return
  }
  const targetType = getEnumValue(result.targetType)
  const index = installs.value.findIndex(
    (item) =>
      getEnumValue(item.targetType) === targetType && item.packageId === result.packageId,
  )
  if (index >= 0) {
    installs.value.splice(index, 1, result)
    return
  }
  installs.value = [result, ...installs.value]
}

function onUninstalled(id: number) {
  installs.value = installs.value.filter((item) => item.id !== id)
}

async function loadInstalls() {
  const result: RestResult<UserPluginInstallResult[]> = await AiUserPluginInstallService.my()
  installs.value = result.data || []
}

onMounted(loadInstalls)

</script>

<template>
  <a-flex vertical gap="large" class="size-full min-h-0 overflow-hidden p-md">
    <div class="shrink-0 text-center">
      <a-segmented v-model:value="value" :options="options" shape="round" />
    </div>
    <a-divider class="m-0 shrink-0" />
    <div class="min-h-0 flex-[1_1_0] overflow-hidden">
      <component
        :is="hubViews[value]"
        :installs="installs"
        @installed="onInstalled"
        @uninstalled="onUninstalled"
      />
    </div>
  </a-flex>
</template>
