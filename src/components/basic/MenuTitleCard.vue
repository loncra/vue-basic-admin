<script setup lang="ts">
import {useMenuPrincipalStore} from '@/stores/menuStore.ts'
import {useSlots} from "vue";

defineOptions({
  name: 'LMenuTitleCard',
})

export interface MenuTitleCardProps {
  /** 未使用 #title 插槽时覆盖菜单标题 */
  title?: string
  /** 未使用 #title 插槽时覆盖菜单图标 */
  icon?: string
}

const slots = useSlots()
const menuPrincipalStore = useMenuPrincipalStore()

</script>

<template>
  <a-card v-bind="$attrs">
    <template v-if="slots.title" #title>
      <slot name="title"/>
    </template>
    <template v-else #title>
      <a-space>
        <icon-font class="icon align" :type="menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.icon || 'icon-survey'"/>
        <span>{{ menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.name || '' }}</span>
      </a-space>
    </template>
    <template #extra>
      <slot name="extra" />
    </template>
    <slot />
  </a-card>
</template>
