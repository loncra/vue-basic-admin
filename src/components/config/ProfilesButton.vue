<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import type {MenuItemType} from 'antdv-next'
import {createIcon, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {MenuInfo} from '@v-c/menu'
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useSocketStore} from "@/stores/socketStore.ts";

const menuPrincipalStore = useMenuPrincipalStore()

defineOptions({
  name: 'LProfileButton',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()
const socketStore = useSocketStore()

const operateItems = ref<MenuItemType[]>([
  {
    type: 'divider',
  },
  {
    key: 'logout',
    label: globalProperties.$t('profile.logout'),
    icon: () => createIcon('loncra-log-out'),
  },
])

function onOperateClickItem(e: MenuInfo) {
  if (e.key === 'logout') {
    globalProperties.$router.push({name: import.meta.env.VITE_APP_AUTH_PAGE_NAME})
  }
  const selected = operateItems.value.find(
    (menuItem) => menuItem != null && menuItem.type !== 'divider' && menuItem.key === e.key,
  )
  if (selected && 'page' in selected && typeof selected.page === 'string') {
    globalProperties.$router.push(selected.page)
  }
}

function mounted() {
  const data = menuPrincipalStore.state
    .menu
    .filter(r => getEnumValue(r.type) === RESOURCE_TYPE.PROFILE)
    .map(r => ({key: String(r.id), label: r.name, icon: createIcon(r.icon || 'loncra-file'), page: r.page}));
  operateItems.value.unshift(...data)
}

onMounted(mounted)
</script>

<template>
  <a-dropdown
    :menu="{ items: operateItems }"
    @menu-click="onOperateClickItem"
  >
    <a-badge :classes="{root: 'hover:cursor-pointer flex'}" :status="socketStore.isConnected ? 'success' : 'error'" :offset="[-3, 28]" dot show-zero>
      <a-avatar :src="principalStore.getAvatarUrl()" >
        {{principalStore.getAvatarPrefix()}}
      </a-avatar>
    </a-badge>
  </a-dropdown>
</template>
