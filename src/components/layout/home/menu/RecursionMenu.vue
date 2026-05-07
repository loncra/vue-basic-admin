<script setup lang="ts">

import LRecursionMenu from "@/components/layout/home/menu/RecursionMenu.vue";
import type {ResourceData} from "@/types";
import {hasTreeChildren} from "@/utils";

defineOptions({
  name: 'LRecursionMenu',
})

interface RecursionMenuProps {
  /**
   * 标题
   */
  data: ResourceData[]
}

const props = withDefaults(defineProps<RecursionMenuProps>(), {
  data: () => [],
})

</script>

<template>
  <template v-for="d of props.data" :key="String(d.id)">
    <a-menu-item :key="String(d.id)" v-if="!hasTreeChildren(d)">
      <template #icon>
        <icon-font class="icon" :type="d.icon || 'icon-survey'"/>
      </template>
      {{ d.name }}
    </a-menu-item>
    <a-sub-menu v-else :key="String(d.id)">
      <template #icon>
        <icon-font class="icon" :type="d.icon  || 'icon-survey'"/>
      </template>
      <template #title>
        {{ d.name }}
      </template>
      <!-- 调用自身递归数据 -->
      <l-recursion-menu :data="d.children || []"/>
    </a-sub-menu>
  </template>
</template>
