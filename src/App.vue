<script setup lang="ts">
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {CrudConfigProvider as LCrudConfigProvider} from '@loncra/antdv-pro'
import {usePrincipalStore} from '@/stores/principalStore'
import {useMenuPrincipalStore} from '@/stores/menuStore'
import {useRouter} from 'vue-router'

defineOptions({
  name: 'App',
})

const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()
const menuPrincipalStore = useMenuPrincipalStore()
const router = useRouter()

function hasPermission(permission: string) {
  return principalStore.hasPermission(permission)
}

function resolveDefaultTitle() {
  const crumb = menuPrincipalStore.state.currentBreadcrumbs.at(-1)
  return {title: crumb?.name ?? '', icon: crumb?.icon ?? 'loncra-file'}
}

function onExported() {
  void router.push({name: 'user_export'})
}
</script>

<template>
  <a-style-provider layer>
    <ax-provider
      :locale="(configProviderStore.localeMessage as { antDesign?: object }).antDesign"
      :component-size="configProviderStore.state.componentSize"
      :theme="{ algorithm: configProviderStore.getAlgorithm(), token: configProviderStore.state.token }"
    >
      <a-app
        class="min-h-screen bg-layout"
        :message="configProviderStore.state.messageConfig"
        :notification="configProviderStore.state.notificationConfig"
      >
        <l-crud-config-provider
          :has-permission="hasPermission"
          :resolve-default-title="resolveDefaultTitle"
          :on-exported="onExported"
        >
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component"/>
            </transition>
          </router-view>
        </l-crud-config-provider>
      </a-app>
    </ax-provider>
  </a-style-provider>
</template>
