<script setup lang="ts">

import {useConfigProviderStore} from '@/stores/configProviderStore'

const configProviderStore = useConfigProviderStore()
</script>

<template>
  <a-style-provider layer>
    <a-config-provider
      :locale="(configProviderStore.localeMessage as { antDesign?: object }).antDesign"
      :component-size="configProviderStore.state.componentSize"
      :theme="{ algorithm: configProviderStore.getAlgorithm(), token: configProviderStore.state.token }"
    >
      <a-app >
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component"/>
          </transition>
        </router-view>
      </a-app>
    </a-config-provider>
  </a-style-provider>
</template>
