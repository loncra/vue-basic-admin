<script setup lang="ts">
import {useMenuPrincipalStore} from '@/stores/menuStore.ts'
import LProfileButton from '@/components/config/ProfilesButton.vue'
import LMenu from '@/components/layout/Menu.vue'
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import {h, onMounted, resolveComponent, type VNode} from "vue";
import type {ResourceEntity} from "@/types/apis";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";

defineOptions({
  name: 'LLayoutHeader',
})

const menuPrincipalStore = useMenuPrincipalStore()

const messageServerStore = useMessageServerStore()

function itemRender(item:ResourceEntity, node:VNode) {
  if (item.code === 'my_message') {
    const badge = resolveComponent('ABadge')
    return h(
      badge,
      {count: messageServerStore.getUnreadQuantity(), dot:true, size: 'small'},
      {default:() => node},
    )
  }
  return node
}

async function mounted(){
  await messageServerStore.installState()
}

onMounted(mounted)

</script>

<template>
  <a-layout-header class="layout-header">
    <a-flex justify="space-between" class="h-full" align="center">
      <a-breadcrumb class="hidden sm:block">
        <a-breadcrumb-item v-for="(breadcrumb, index) in menuPrincipalStore.state.currentBreadcrumbs" :key="breadcrumb.name">
          <a-space>
            <icon-font class="icon align" :type="breadcrumb.icon || 'icon-survey'"/>
            <router-link
              :to="breadcrumb.page"
              v-if="index != menuPrincipalStore.state.currentBreadcrumbs.length - 1 && breadcrumb.page"
            >
              <a-typography-text type="secondary">
                {{ breadcrumb.name }}
              </a-typography-text>
            </router-link>
            <a-typography-text v-else strong>
              {{ breadcrumb.name }}
            </a-typography-text>
          </a-space>
        </a-breadcrumb-item>
      </a-breadcrumb>
      <span />
      <a-space align="center">
        <l-menu
          :menu-types="[RESOURCE_TYPE.TOOL]"
          :hide-label="true"
          :item-render="itemRender"
          mode="horizontal"
        />
        <l-profile-button/>
      </a-space>
    </a-flex>
  </a-layout-header>
</template>
