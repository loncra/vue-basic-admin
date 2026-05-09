<script setup lang="ts">

import {useConfigProviderStore} from '@/stores/configProviderStore'
// 获取配置提供者 Store，用于管理主题和国际化配置
const configProviderStore = useConfigProviderStore()
</script>

<template>
  <a-style-provider layer>
    <a-config-provider
      :key="configProviderStore.state.locale"
      :locale="(configProviderStore.localeMessage as { antDesign?: object }).antDesign"
      :theme="{ algorithm: configProviderStore.state.algorithm }"
    >
      <a-app>
        <router-view v-slot="{ Component }">
          <!-- 页面过渡动画 -->
          <!-- fade-transform: 淡入淡出 + 变换效果 -->
          <!-- out-in: 先退出旧组件，再进入新组件 -->
          <transition name="fade-transform" mode="out-in">
            <component :is="Component"/>
          </transition>
        </router-view>
      </a-app>
    </a-config-provider>
  </a-style-provider>
</template>
