<script setup lang="ts">
import {renderIconFont} from '@/utils/commonUtils'
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import type {MenuItemType} from 'antdv-next'
import {requireNonNullOrUndefined} from '@/utils'
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import type {MenuInfo} from '@v-c/menu'
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useSocketStore} from "@/stores/socketStore.ts";
import {UserAvatar as LUserAvatar} from '@loncra/antdv-pro';
import {getAuthRouterParam} from "@/routers";
import {AUTH_SERVER_RESOURCE_TYPE} from '@loncra/client/auth'
import {getEnumValue} from '@loncra/client/commons'

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
    icon: () => renderIconFont('loncra-log-out'),
  },
])

function onOperateClickItem(e: MenuInfo) {
  if (e.key === 'logout') {
    globalProperties.$router.push(getAuthRouterParam(principalStore.state.type))
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
    .filter(r => getEnumValue(r.type) === AUTH_SERVER_RESOURCE_TYPE.PROFILE)
    .map(r => ({key: String(r.id), label: r.name, icon: renderIconFont(r.icon || 'loncra-file'), page: r.page}));
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
      <l-user-avatar :user="principalStore.state.details.metadata" />
    </a-badge>
  </a-dropdown>
</template>
