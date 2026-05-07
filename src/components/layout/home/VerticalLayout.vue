<script setup lang="ts">
import DLayoutHeader from '@/components/layout/home/support/LayoutHeader.vue'
import DLayoutContent from '@/components/layout/home/support/LayoutContent.vue'
import DLayoutSider from '@/components/layout/home/support/LayoutSider.vue'

defineOptions({
  name: 'DVerticalLayout',
})
</script>

<template>
  <div class="h-screen">
    <a-layout class="h-full">
      <d-layout-sider />
      <a-layout class="h-full">
        <d-layout-header />

        <d-layout-content />
      </a-layout>
    </a-layout>
  </div>
</template>
