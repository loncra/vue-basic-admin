<script setup lang="ts">

import {
  type ComponentInternalInstance,
  computed,
  defineAsyncComponent,
  getCurrentInstance,
  ref
} from "vue";
import {createIcon, requireNonNullOrUndefined} from "@/utils";

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
}

const value = ref<keyof typeof hubViews>('LAgentHubMcp')

const options = computed(() => [{
  value: 'LAgentHubMcp',
  label: globalProperties.$t('agent.hub.mcp'),
  icon:createIcon('loncra-plug-zap', 'align')
},{
  value: 'LAgentHubSkill',
  label: globalProperties.$t('agent.hub.skill'),
  icon:createIcon('loncra-sparkles', 'align')
}])

</script>

<template>
  <a-flex vertical gap="large" class="size-full min-h-0 overflow-hidden p-md">
    <div class="shrink-0 text-center">
      <a-segmented v-model:value="value" :options="options" shape="round" />
    </div>
    <a-divider class="m-0 shrink-0" />
    <div class="min-h-0 flex-[1_1_0] overflow-hidden">
      <component :is="hubViews[value]" />
    </div>
  </a-flex>
</template>
