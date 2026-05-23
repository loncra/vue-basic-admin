<script setup lang="ts">
import {useMenuPrincipalStore} from '@/stores/menuStore.ts'
import {useSlots} from "vue";

defineOptions({
  name: 'LMenuTitleCard',
})

const slots = useSlots()
const menuPrincipalStore = useMenuPrincipalStore()

const props = withDefaults(defineProps<{
  hideTitle?:boolean
}>(), {
  hideTitle:false
})


</script>

<template>
  <a-card v-bind="$attrs">
    <template v-if="slots.title" #title>
      <slot name="title" v-if="!props.hideTitle"/>
    </template>
    <template v-else-if="!props.hideTitle" #title>
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
