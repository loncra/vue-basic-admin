<script setup lang="ts">


import type {ButtonAuthorityProps} from "@/types";
import {type ComponentInternalInstance, computed, getCurrentInstance} from "vue";
import type {MenuProps} from "antdv-next";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {MenuInfo} from '@v-c/menu'

type MenuItemEntry = NonNullable<MenuProps["items"]>[number]

/** 仅用于本组件 push 的扁平菜单项（含 icon / label），与 antdv ItemType 并集区分 */
type LoneActionMenuRow = {
  key?: string
  label?: unknown
  icon?: (() => unknown) | unknown
}

function toLoneActionMenuRow(item: MenuItemEntry | undefined): LoneActionMenuRow | null {
  if (!item || item.type === "divider" || !("icon" in item) || !("label" in item) || item.icon == null) {
    return null
  }
  return item as LoneActionMenuRow
}

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
  actionItemClick: [e:MenuInfo]
}>()

const menuItems = computed<NonNullable<MenuProps['items']>>(() => {
  const items: NonNullable<MenuProps['items']> = []

  if (!principalStore.hasAnyPermission([props.authority?.add || '', props.authority?.export || '', props.authority?.delete || ''])) {
    return items
  }

  if (principalStore.hasPermission(props.authority?.add || '')) {
    items.push({
      key: 'add',
      label: globalProperties.$t('common.add'),
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

const loneMenuItem = computed(() => {
  const list = menuItems.value
  if (list.length !== 1) {
    return null
  }
  return toLoneActionMenuRow(list[0])
})

function dispatchMenuKey(key: string, e?: MenuInfo) {
  if (key === 'add') {
    emit('add')
  } else if (key === 'delete') {
    emit('delete')
  } else if (key === 'export') {
    emit('export')
  } else if (e != null) {
    emit('actionItemClick', e)
  }
}

function handleActionClick(e: MenuInfo) {
  dispatchMenuKey(e.key, e)
}

</script>

<template>
  <a-dropdown
    v-if="menuItems.length > 1"
    placement="bottomRight"
    :menu="{ items: menuItems, onClick: handleActionClick }"
  >
    <a-button>
      <template #icon>
        <icon-font class="icon" type="icon-more"/>
      </template>
    </a-button>
  </a-dropdown>
  <template v-else-if="menuItems.length === 1">
    <a-button @click="dispatchMenuKey(loneMenuItem?.key ?? '')">
      <template #icon>
        <component
          :is="typeof loneMenuItem?.icon === 'function' ? loneMenuItem.icon() : loneMenuItem?.icon"
        />
      </template>
      <span>
        {{ loneMenuItem?.label }}
      </span>
    </a-button>
  </template>
</template>
