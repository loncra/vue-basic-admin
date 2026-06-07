<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'

defineOptions({
  name: 'IndexHome',
})
import { useSocketStore } from '@/stores/socketStore.ts'
import {onMounted, onUnmounted} from "vue";

const socketStore = useSocketStore()

onMounted(() => socketStore.connect())

onUnmounted(() => socketStore.disconnect())
</script>

<template>
  <div>
    <home-layout/>
  </div>
</template>
