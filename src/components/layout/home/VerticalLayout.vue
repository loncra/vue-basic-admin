<script setup lang="ts">
import LLayoutHeader from '@/components/layout/home/support/LayoutHeader.vue'
import LLayoutContent from '@/components/layout/home/support/LayoutContent.vue'
import LLayoutSider from '@/components/layout/home/support/LayoutSider.vue'
import {provide, ref} from "vue";
import {SWITCH_WORKSPACE_PROVIDE_KEY} from "@/constants";

defineOptions({
  name: 'LVerticalLayout',
})

const layoutSiderRef = ref()

provide(SWITCH_WORKSPACE_PROVIDE_KEY, (id:number | undefined) => layoutSiderRef.value?.switchWorkspace(id))

</script>

<template>
  <div class="h-screen">
    <a-layout class="h-full">
      <l-layout-sider ref="layoutSiderRef"/>
      <a-layout class="h-full">
        <l-layout-header/>

        <l-layout-content/>
      </a-layout>
    </a-layout>
  </div>
</template>
