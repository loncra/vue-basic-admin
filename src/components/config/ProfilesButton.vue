<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import type {MenuItemType} from 'antdv-next'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";

const menuPrincipalStore = useMenuPrincipalStore()

/** 菜单点击事件参数 */
interface MenuClickInfo {
  key: string
}

defineOptions({
  name: 'LProfileButton',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const operateItems = ref<MenuItemType[]>([
  {
    type: 'divider',
  },
  {
    key: 'logout',
    label: globalProperties.$t('profile.logout'),
    icon: () => createIcon('icon-shut-down'),
  },
])

function onOperateClickItem(e: MenuClickInfo) {
  if (e.key === 'logout') {
    globalProperties.$router.push({name: import.meta.env.VITE_APP_AUTH_PAGE_NAME})
  } else if (e.key === 'setting') {
    globalProperties.$router.push({name: 'setting'})
  }
}

function mounted() {
  const data = menuPrincipalStore.state
    .filter(r => r.type.value === RESOURCE_TYPE.PROFILE)
    .map(r => ({key: r.id, label: r.name, icon: createIcon(r.icon || 'icon-survey')}));
  operateItems.value.unshift(...data)
}

onMounted(mounted)
</script>

<template>
  <a-dropdown
    :trigger="['click']"
    :menu="{ items: operateItems }"
    @menu-click="onOperateClickItem"
  >
    <a-badge :classes="{root: 'hover:cursor-pointer flex'}" :status="'success'" dot show-zero>
      <!-- <div class="hover:cursor-pointer"> -->
      <a-avatar>
        M
      </a-avatar>
      <!-- </div> -->
    </a-badge>
  </a-dropdown>
</template>
