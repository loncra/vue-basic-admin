<script setup lang="ts">
import {useConfigProviderStore} from '@/stores/configProviderStore'

defineOptions({
  name: 'App',
})

const configProviderStore = useConfigProviderStore()
</script>

<template>
  <a-style-provider layer>
    <ax-provider
      :locale="(configProviderStore.localeMessage as { antDesign?: object }).antDesign"
      :component-size="configProviderStore.state.componentSize"
      :theme="{ algorithm: configProviderStore.getAlgorithm(), token: configProviderStore.state.token }"
    >
      <a-app :message="configProviderStore.state.messageConfig" :notification="configProviderStore.state.notificationConfig">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component"/>
          </transition>
        </router-view>
      </a-app>
    </ax-provider>
  </a-style-provider>
</template>
