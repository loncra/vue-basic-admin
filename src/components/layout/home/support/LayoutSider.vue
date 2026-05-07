<script setup lang="ts">
import {useConfigProviderStore} from '@/stores/configProviderStore.js'
import LLogo from '@/components/Logo.vue'
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";

import LMenu from '@/components/layout/home/menu/Menu.vue'

defineOptions({
  name: 'LLayoutSider',
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
  >
    <a-flex vertical class="h-full">
      <a-layout-header class="bg-container px-0 border-b border-b-border-secondary border-solid">
        <a-flex align="center" class="h-full pr-lg pl-lg">
          <l-logo :hide-text="configProviderStore.state.homeCollapsible" />
        </a-flex>
      </a-layout-header>
      <div class="h-full overflow-auto bg-container shadow-ter border-r border-r-border-secondary border-solid">
        <l-menu
          mode="inline"
          :menu-types="[RESOURCE_TYPE.MENU, RESOURCE_TYPE.ROOT, RESOURCE_TYPE.DIRECTORY]"
        />
      </div>
    </a-flex>
  </a-layout-sider>
</template>
