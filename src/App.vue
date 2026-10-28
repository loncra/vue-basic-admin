<script setup lang="ts">
import {computed, getCurrentInstance, h, onMounted, type VNode} from 'vue'
import {Space} from 'antdv-next'
import axios from '@/requests'
import {createAxiosHttpClient} from '@loncra/client/adapters/axios'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import type {CrudNavigateTarget} from '@loncra/antdv-pro'
import {Provider} from '@loncra/antdv-chat-pro'
import type {VNodeChild} from '@loncra/antdv'
import {usePrincipalStore} from '@/stores/principalStore'
import {useMenuPrincipalStore} from '@/stores/menuStore'
import {useBootstrapStore} from '@/stores/bootStore.ts'
import {convertFormUrlencoded, renderIconFont} from '@/utils/commonUtils'
import {crudFormatters} from '@/utils/crudFormatters'
import i18n from '@/i18n'

defineOptions({
  name: 'App',
})

const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()
const menuPrincipalStore = useMenuPrincipalStore()
const bootStore = useBootstrapStore()
const globalProperties = getCurrentInstance()!.appContext.config.globalProperties
const router = globalProperties.$router

const initialHref = location.pathname + location.search + location.hash

onMounted(async () => {
  const ok = await bootStore.run()
  if (!ok) {
    return
  }
  await router.replace(initialHref)
  window.__boot?.remove()
})

const http = createAxiosHttpClient(axios)
const runtimeMode = import.meta.env.VITE_APP_RUNTIME_MODE
const resourcePath = import.meta.env.VITE_APP_RESOURCE_PATH
const uploadBlockSize = Number(import.meta.env.VITE_APP_UPLOAD_BLOCK_SIZE)

const localeMessage = computed(() => configProviderStore.antdvLocaleMessage())

function getAccessToken(): string | null {
  return localStorage.getItem(import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME)
}

function openAttachmentUrl(url: string): void {
  window.open(url)
}

function formValueConvert(_key: string, value: unknown) {
  return convertFormUrlencoded(value)
}

function i18nResolver(key: string, named?: Record<string, unknown>) {
  return i18n.global.t(key, named as never)
}

const dateFormat = import.meta.env.VITE_APP_DATE_VALUE_FORMAT
const dateTimeFormat = import.meta.env.VITE_APP_DATE_TIME_VALUE_FORMAT

function hasPermission(permission: string) {
  return principalStore.hasPermission(permission)
}

function resolveDefaultTitle(): VNodeChild {
  const crumb = menuPrincipalStore.state.currentBreadcrumbs.at(-1)
  const icon = renderIconFont(crumb?.icon ?? 'loncra-file', 'align') as unknown as VNode
  return h(Space, null, {
    default: () => [icon, h('span', crumb?.name ?? '')],
  }) as unknown as VNodeChild
}

function onNavigate({kind, name, record, variant}: CrudNavigateTarget) {
  if (!name || variant != null) {
    return
  }
  const id = record?.id
  const withId = (kind === 'edit' || kind === 'detail') && id != null
  void router.push({name, query: withId ? {id: String(id)} : undefined})
}
</script>

<template>
  <a-style-provider layer>
    <!--
      一层顶原来的「客户端配置 + antdv 主题/语言/尺寸 + CRUD 配置」。
      `antdv` 是宿主自己初始化的那份（初值从 localStorage 读、变更写回、`data-theme` 同步都在 `@/stores/configProviderStore`）。
    -->
    <provider
      :antdv-config="configProviderStore.antdv"
      :locale-message="localeMessage"
      :http="http"
      :runtime-mode="runtimeMode"
      :get-access-token="getAccessToken"
      :resource-path="resourcePath"
      :open-attachment-url="openAttachmentUrl"
      :form-value-convert="formValueConvert"
      :upload-block-size="uploadBlockSize"
      :has-permission="hasPermission"
      :i18n-resolver="i18nResolver"
      :resolve-default-title="resolveDefaultTitle"
      :on-navigate="onNavigate"
      :formatters="crudFormatters"
      :date-format="dateFormat"
      :date-time-format="dateTimeFormat"
    >
      <a-app
        class="min-h-screen bg-layout"
        :message="configProviderStore.state.messageConfig"
        :notification="configProviderStore.state.notificationConfig"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component"/>
          </transition>
        </router-view>
      </a-app>
    </provider>
  </a-style-provider>
</template>
