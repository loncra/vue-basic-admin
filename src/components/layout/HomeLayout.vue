<script setup lang="ts">
import LVerticalLayout from '@/components/layout/home/VerticalLayout.vue'
import {usePrincipalStore} from "@/stores/principalStore.ts";

const principalStore = usePrincipalStore()
</script>

<template>
  <a-watermark :content="principalStore.getName()">
    <l-vertical-layout/>
  </a-watermark>
</template>
