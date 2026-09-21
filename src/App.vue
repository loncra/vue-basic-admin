<script setup lang="ts">
import {h, onMounted, type VNode} from 'vue'
import {Space} from 'antdv-next'
import axios from '@/requests'
import {createAxiosHttpClient} from '@loncra/client/adapters/axios'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import type {CrudNavigateTarget} from '@loncra/antdv-pro'
import {
  ClientProvider as LClientProvider,
  CrudConfigProvider as LCrudConfigProvider
} from '@loncra/antdv-pro'
// `VNodeChild` 取**包的类型视野**（两份 vue 副本的 d.ts 互不兼容，运行期是同一份 vue）
import type {VNodeChild} from '@loncra/antdv'
import {usePrincipalStore} from '@/stores/principalStore'
import {useMenuPrincipalStore} from '@/stores/menuStore'
import {useBootstrapStore} from '@/stores/bootStore.ts'
import {convertFormUrlencoded, renderIconFont} from '@/utils/commonUtils'
import {useRouter} from 'vue-router'
import i18n from '@/i18n'

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
    return // 失败时骨架保留，展示错误 + 重试
  }
  // 先完成首次导航（目标页面已渲染），再移除骨架，避免中间露出空白
  await router.replace(initialHref)
  window.__boot?.remove()
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

/** 列表/表单/详情的**默认**文案解析：声明层给了 `i18nResolver` 就优先用声明层的，这里只是兜底 */
function i18nResolver(key: string, named?: Record<string, unknown>) {
  return i18n.global.t(key, named as never)
}

function hasPermission(permission: string) {
  return principalStore.hasPermission(permission)
}

/**
 * 列表页默认标题（面包屑）：**在这里拼成 VNode**交给 pro（pro 不关心里面是图标还是文字）。
 *
 * 两次 `as` 是"两份 vue 副本"的代价：`renderIconFont` 的返回按**包视野**声明（pro 的动作类型吃它），
 * 喂给宿主的 `h` 时要当宿主 VNode 用，整体结果再按包视野交出去 —— 运行期是同一份 vue（vite 已 dedupe）。
 */
function resolveDefaultTitle(): VNodeChild {
  const crumb = menuPrincipalStore.state.currentBreadcrumbs.at(-1)
  const icon = renderIconFont(crumb?.icon ?? 'loncra-file', 'align') as unknown as VNode
  return h(Space, null, [icon, h('span', crumb?.name ?? '')]) as unknown as VNodeChild
}

/**
 * 列表页的跳转**兜底**：页面声明（`CrudPageCore.onNavigate`）没给实现时才用它。
 * 约定：编辑 / 详情带 `id`（`BasicIdMetadata.id` 是可选的，要判空）；
 * 内嵌列表（variant 不是整页）不动。
 */
function onNavigate({kind, name, record, variant}: CrudNavigateTarget) {
  // 兜底只服务整页列表：宿主给了形态名（如 'picker'）说明是内嵌场景，不跳
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
            :i18n-resolver="i18nResolver"
            :resolve-default-title="resolveDefaultTitle"
            :on-navigate="onNavigate"
          >
            <router-view v-slot="{ Component }">
              <transition name="fade-transform" mode="out-in">
                <component :is="Component"/>
              </transition>
            </router-view>
          </l-crud-config-provider>
        </a-app>
      </ax-provider>
    </l-client-provider>
  </a-style-provider>
</template>
