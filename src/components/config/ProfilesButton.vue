<script setup lang="ts">
import { type ComponentInternalInstance, getCurrentInstance, ref } from 'vue'
import type { MenuItemType } from 'antdv-next'
import { createIcon, requireNonNullOrUndefined } from '@/utils'

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
    key: 'setting',
    label: globalProperties.$t('profile.setting'),
    icon: () => createIcon('icon-conditions'),
  },
  {
    key: 'account',
    label: globalProperties.$t('profile.account'),
    icon: () => createIcon('icon-security'),
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    label: globalProperties.$t('profile.logout'),
    icon: () => createIcon('icon-shut-down'),
  },
])

const onOperateClickItem = (e: MenuClickInfo) => {
  if (e.key === 'logout') {
    globalProperties.$router.push({ name: import.meta.env.VITE_APP_AUTH_PAGE_NAME })
  } else if (e.key === 'setting') {
    globalProperties.$router.push({ name: 'setting' })
  }
}
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
