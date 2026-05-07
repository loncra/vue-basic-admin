<script setup lang="ts">
import {useConfigProviderStore} from '@/stores/configProviderStore.js'
import DLogo from '@/components/Logo.vue'

defineOptions({
  name: 'DLayoutSider',
})

const configProviderStore = useConfigProviderStore()
</script>

<template>
  <a-layout-sider
    v-model:collapsed="configProviderStore.state.homeCollapsible"
    :collapsed-width="configProviderStore.state.homeCollapsedWidth"
    :width="configProviderStore.state.homeSiderWidth"
    :trigger="null"
    :theme="configProviderStore.state.theme"
    class="layout-sider"
  >
    <a-flex vertical class="h-full">
      <a-layout-header class="bg-container px-0 border-b border-b-border-secondary border-solid">
        <a-flex align="center" class="h-full pr-lg pl-lg">
          <d-logo :hide-text="configProviderStore.state.homeCollapsible" />
        </a-flex>
      </a-layout-header>
      <div class="h-full overflow-auto">
<!--        <d-menu
          mode="inline"
          :menu-types="[RESOURCE_TYPE.MENU, RESOURCE_TYPE.ROOT, RESOURCE_TYPE.DIRECTORY]"
        />-->
      </div>
    </a-flex>
  </a-layout-sider>
</template>
