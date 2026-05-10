<script setup lang="ts">
import {useMenuPrincipalStore} from '@/stores/menuStore.ts'
import {type ComponentInternalInstance, computed, getCurrentInstance, useSlots} from 'vue'
import {filterTreeDeep, requireNonNullOrUndefined, unmergeTree} from '@/utils'
import type {ResourceMetadata} from '@/types'

defineOptions({
  name: 'LMenuTitleCard',
})

export interface MenuTitleCardProps {
  /** 未使用 #title 插槽时覆盖菜单标题 */
  title?: string
  /** 未使用 #title 插槽时覆盖菜单图标 */
  icon?: string
}

const props = withDefaults(defineProps<MenuTitleCardProps>(), {
  title: '',
  icon: 'icon-survey',
})

const slots = useSlots()
const menuPrincipalStore = useMenuPrincipalStore()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const hasCustomTitle = computed(() => Boolean(slots.title))

const detail = computed(() => {
  const data = filterTreeDeep<ResourceMetadata>(
    (r: ResourceMetadata) => r.page === globalProperties.$route.path,
    menuPrincipalStore.state,
  )

  const menu = unmergeTree<ResourceMetadata>(data).at(-1);
  if (menu) {
    return {
      title: menu?.name || props.title,
      icon: menu?.icon || props.icon,
    }
  } else {
    return {
      title: globalProperties.$route?.meta?.title || props.title,
      icon: globalProperties.$route?.meta?.icon || props.icon,
    }
  }
})

</script>

<template>
  <a-card v-bind="$attrs">
    <template v-if="hasCustomTitle" #title>
      <slot name="title"/>
    </template>
    <template v-else #title>
      <a-space>
        <icon-font class="icon align" :type="detail.icon"/>
        <span>{{ detail.title }}</span>
      </a-space>
    </template>
    <template #extra>
      <slot name="extra" />
    </template>
    <slot/>
  </a-card>
</template>
