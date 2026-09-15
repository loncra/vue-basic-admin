<script setup lang="ts">
import {computed} from 'vue'
import {useBootstrapStore} from '@/stores/bootstrapStore.ts'
import type {BootStep} from '@/stores/bootstrapStore.ts'

defineOptions({
  name: 'BootLoading',
})

const stepText: Record<BootStep, string> = {
  idle: '正在初始化…',
  prepare: '正在连接服务…',
  routes: '正在加载功能…',
  menus: '正在加载菜单…',
  ready: '即将进入…',
  error: '初始化失败',
}

const bootStore = useBootstrapStore()

const text = computed(() => stepText[bootStore.step])
</script>

<template>
  <div class="fixed inset-0 z-2000 flex flex-col items-center justify-center gap-5 bg-layout">
    <a-spin v-if="!bootStore.failed" size="large"/>
    <span class="text-sm opacity-70">{{ text }}</span>
    <div v-if="bootStore.failed" class="flex w-80 flex-col items-center gap-3">
      <a-alert class="w-full" type="error" show-icon :message="bootStore.error || '初始化失败'"/>
      <a-button type="primary" @click="bootStore.retry()">重试</a-button>
    </div>
  </div>
</template>
