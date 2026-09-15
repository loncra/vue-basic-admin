<script setup lang="ts">
import {onMounted} from 'vue'
import axios from '@/requests'
import {createAxiosHttpClient} from '@loncra/client/adapters/axios'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {
  ClientProvider as LClientProvider,
  CrudConfigProvider as LCrudConfigProvider
} from '@loncra/antdv-pro'
import {usePrincipalStore} from '@/stores/principalStore'
import {useMenuPrincipalStore} from '@/stores/menuStore'
import {useBootstrapStore} from '@/stores/bootstrapStore.ts'
import BootLoading from '@/views/Bootstrap.vue'
import {convertFormUrlencoded} from '@/utils/commonUtils'
import {useRouter} from 'vue-router'
import {RESOURCE_SERVER_USER_EXPORT_ROUTE} from "@/constants";

defineOptions({
  name: 'App',
})

const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()
const menuPrincipalStore = useMenuPrincipalStore()
const bootStore = useBootstrapStore()
const router = useRouter()

// 地址栏回车时的原始地址：首次导航发生在路由装配之前，装配完成后要补跳一次
const initialHref = location.pathname + location.search + location.hash

onMounted(async () => {
  const ok = await bootStore.run()
  if (!ok) {
    return
  }
  await router.replace(initialHref)
})

// ===== 客户端（HTTP / 运行时）配置：在此构建，交给 LClientProvider =====
const http = createAxiosHttpClient(axios)
const runtimeMode = import.meta.env.VITE_APP_RUNTIME_MODE
const resourcePath = import.meta.env.VITE_APP_RESOURCE_PATH
const uploadBlockSize = Number(import.meta.env.VITE_APP_UPLOAD_BLOCK_SIZE)

function getAccessToken(): string | null {
  return localStorage.getItem(import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME)
}

function openAttachmentUrl(url: string): void {
  window.open(url)
}

function formValueConvert(_key: string, value: unknown) {
  return convertFormUrlencoded(value)
}

function hasPermission(permission: string) {
  return principalStore.hasPermission(permission)
}

function resolveDefaultTitle() {
  const crumb = menuPrincipalStore.state.currentBreadcrumbs.at(-1)
  return {title: crumb?.name ?? '', icon: crumb?.icon ?? 'loncra-file'}
}

function onExported() {
  void router.push({name: RESOURCE_SERVER_USER_EXPORT_ROUTE})
}
</script>

<template>
  <a-style-provider layer>
    <l-client-provider
      :http="http"
      :runtime-mode="runtimeMode"
      :get-access-token="getAccessToken"
      :resource-path="resourcePath"
      :open-attachment-url="openAttachmentUrl"
      :form-value-convert="formValueConvert"
      :upload-block-size="uploadBlockSize"
    >
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
          <boot-loading v-if="!bootStore.ready"/>
        </a-app>
      </ax-provider>
    </l-client-provider>
  </a-style-provider>
</template>
