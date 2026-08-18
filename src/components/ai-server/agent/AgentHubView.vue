<script setup lang="ts">

import {
  type ComponentInternalInstance,
  computed,
  defineAsyncComponent,
  getCurrentInstance,
  h, ref
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

const value = ref<string>('LAgentHubMcp')

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
  <div class="p-md">
    <a-space orientation="vertical" size="large">
      <div class="text-center">
        <a-segmented v-model:value="value" :options="options" shape="round" />
      </div>
      <a-divider class="m-0" />
      <component :is="hubViews[value]" />
    </a-space>
  </div>
</template>
