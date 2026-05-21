<script setup lang="ts">
import {useMenuPrincipalStore} from '@/stores/menuStore.ts'
import LProfileButton from '@/components/config/ProfilesButton.vue'
import LMenu from '@/components/layout/Menu.vue'
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";

defineOptions({
  name: 'LLayoutHeader',
})

const menuPrincipalStore = useMenuPrincipalStore()

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
        <l-menu :menu-types="[RESOURCE_TYPE.TOOL]" :hide-label="true" mode="horizontal"/>
        <l-profile-button/>
      </a-space>
    </a-flex>
  </a-layout-header>
</template>
