<script setup lang="ts">
import {antdvConfig} from '@/stores/antdvConfig'
import {useConfigProviderStore} from '@/stores/configProviderStore.js'
import LLogo from '@/components/Logo.vue'
import LMenu from '@/components/layout/Menu.vue'
import {ref} from "vue";
import {AUTH_SERVER_RESOURCE_TYPE} from '@loncra/client/auth'

defineOptions({
  name: 'LLayoutSider',
})

const configProviderStore = useConfigProviderStore()
const logoRef = ref()

defineExpose({
  switchWorkspace:(id:number | undefined) => logoRef.value?.switchWorkspace(id)
})

</script>

<template>
  <a-layout-sider
    v-model:collapsed="configProviderStore.state.homeCollapsible"
    :collapsed-width="configProviderStore.state.homeCollapsedWidth"
    :width="configProviderStore.state.homeSiderWidth"
    :trigger="null"
    :theme="antdvConfig.theme.value"
    class="layout-sider"
  >
    <a-flex vertical class="h-full">
      <a-layout-header class="bg-container px-0 border-b border-b-border-secondary border-solid">
        <a-flex align="center" class="h-full pr-md pl-md">
          <l-logo ref="logoRef" :hide-text="configProviderStore.state.homeCollapsible"/>
        </a-flex>
      </a-layout-header>
      <div class="h-full overflow-auto bg-container">
        <l-menu :menu-types="[AUTH_SERVER_RESOURCE_TYPE.MENU, AUTH_SERVER_RESOURCE_TYPE.ROOT, AUTH_SERVER_RESOURCE_TYPE.DIRECTORY]" mode="inline"/>
      </div>
    </a-flex>
  </a-layout-sider>
</template>
