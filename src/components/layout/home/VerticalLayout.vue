<script setup lang="ts">
import LLayoutHeader from '@/components/layout/home/support/LayoutHeader.vue'
import LLayoutContent from '@/components/layout/home/support/LayoutContent.vue'
import LLayoutSider from '@/components/layout/home/support/LayoutSider.vue'

defineOptions({
  name: 'LVerticalLayout',
})
</script>

<template>
  <div class="h-screen">
    <a-layout class="h-full">
      <l-layout-sider/>
      <a-layout class="h-full">
        <l-layout-header/>

        <l-layout-content/>
      </a-layout>
    </a-layout>
  </div>
</template>
