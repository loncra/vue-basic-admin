<script setup lang="ts">


import type {ButtonAuthorityProps} from "@/types";
import {type ComponentInternalInstance, computed, getCurrentInstance} from "vue";
import type {MenuProps} from "antdv-next";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LActionButton from "@/components/basic/ActionButton.vue";


export interface AuthorityButtonProps {
  authority?: ButtonAuthorityProps
  actionItems?: NonNullable<MenuProps['items']>
}

defineOptions({
  name: 'LAuthorityButton',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const props = withDefaults(
  defineProps<AuthorityButtonProps>(),
  {
    actionItems: () => [],
  },
)

const emit = defineEmits<{
  add: []
  delete: []
  export: []
  actionItemClick: [string]
}>()

const menuItems = computed<NonNullable<MenuProps['items']>>(() => {
  const items: NonNullable<MenuProps['items']> = []

  if (!principalStore.hasAnyPermission([props.authority?.add || '', props.authority?.export || '', props.authority?.delete || ''])) {
    return items
  }

  if (principalStore.hasPermission(props.authority?.add || '')) {
    items.push({
      key: 'add',
      label: globalProperties.$t('common.add',{name:''}),
      icon: () => createIcon('icon-add', 'align'),
    })
  }
  if (principalStore.hasPermission(props.authority?.export || '')) {
    items.push({
      key: 'export',
      label: globalProperties.$t('common.export'),
      icon: () => createIcon('icon-goods-start-to-ship', 'align'),
    })
  }
  if (principalStore.hasPermission(props.authority?.delete || '')) {
    items.push({
      key: 'delete',
      label: globalProperties.$t('common.deleteSelected'),
      icon: () => createIcon('icon-delete', 'align'),
    })
  }

  if (props.actionItems.length > 0) {
    if (items.length > 0) {
      items.push({type: 'divider'})
    }
    items.push(...props.actionItems)
  }

  return items
})

function handleActionClick(key: string) {
  if (key === 'add') {
    emit('add')
  } else if (key === 'delete') {
    emit('delete')
  } else if (key === 'export') {
    emit('export')
  } else  {
    emit('actionItemClick', key)
  }
}

</script>

<template>
  <l-action-button v-bind="$attrs" :action-items="menuItems" @action-item-click="handleActionClick"/>
</template>
