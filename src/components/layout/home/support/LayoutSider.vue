<script setup lang="ts">
import {useConfigProviderStore} from '@/stores/configProviderStore.js'
import LLogo from '@/components/Logo.vue'
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {ResourceData} from "@/types";
import {type ComponentInternalInstance, getCurrentInstance, h, onMounted, ref, watch} from "vue";
import type {RouteLocationNormalizedLoaded} from "vue-router";
import {createIcon, filterTreeDeep, requireNonNullOrUndefined, unmergeTree} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";

defineOptions({
  name: 'LLayoutSider',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const configProviderStore = useConfigProviderStore()
const menuPrincipalStore = useMenuPrincipalStore()

interface MenuState {
  selectedKeys:string[],
  openKeys:string[],
  data: ResourceData[],
}

const menuOptions = ref<MenuState>({
  selectedKeys: [],
  openKeys: [],
  data:[],
})


const collapsedAndSelectedMenu = (route: RouteLocationNormalizedLoaded) => {
  const data: ResourceData[] = filterTreeDeep<ResourceData>(
    (r) => r.page === route.path,
    menuOptions.value.data,
  )
  if (data.length <= 0) {
    return
  }
  const unmergeData: ResourceData[] = unmergeTree<ResourceData>(data)
  const values: string[] = unmergeData.map(d => d.key)
  if (values.length <= 0) {
    return
  }
  const leafKey = values[values.length - 1] as string
  menuOptions.value.selectedKeys = [leafKey]
  menuOptions.value.openKeys = values.slice(0, -1).map((v) => v)
}

// 监听路由变化：路由变化 => 对应分段激活或追加
watch(
  () => globalProperties.$route,
  () => collapsedAndSelectedMenu(globalProperties.$route),
  { deep: true },
)

function labelRender(item: ResourceData) {
  if (item == null || typeof item !== 'object') {
    return
  }
  if (item.type.value === RESOURCE_TYPE.MENU) {
    return h('a', {"href":item.page || 'javascript:;'}, String(item.name))
  } else {
    return h('span', {}, String(item.name))
  }
}

function iconRender(item: ResourceData) {
  return createIcon(item.icon || 'icon-survey')
}

const mounted = async () => {
  const result:ResourceData[] = await menuPrincipalStore.getPrincipalResources([RESOURCE_TYPE.MENU, RESOURCE_TYPE.ROOT, RESOURCE_TYPE.DIRECTORY, RESOURCE_TYPE.TOOL]);
  menuOptions.value.data = (result || []).filter(r => r.type.value !== RESOURCE_TYPE.TOOL);
}

onMounted(mounted)
</script>

<template>
  <a-layout-sider
    v-model:collapsed="configProviderStore.state.homeCollapsible"
    :collapsed-width="configProviderStore.state.homeCollapsedWidth"
    :width="configProviderStore.state.homeSiderWidth"
    :trigger="null"
    :theme="configProviderStore.state.theme"
  >
    <a-flex vertical class="h-full">
      <a-layout-header class="bg-container px-0 border-b border-b-border-secondary border-solid">
        <a-flex align="center" class="h-full pr-lg pl-lg">
          <l-logo :hide-text="configProviderStore.state.homeCollapsible" />
        </a-flex>
      </a-layout-header>
      <div class="h-full overflow-auto bg-container shadow-ter border-r border-r-border-secondary border-solid">
        <a-menu
          :classes="{root:'border-e-0'}"
          mode="inline"
          v-model:open-keys="menuOptions.openKeys"
          v-model:selected-keys="menuOptions.selectedKeys"
          :items="menuOptions.data"
          :label-render="labelRender"
          :icon-render="iconRender"
          v-bind="$attrs"
        >
        </a-menu>
      </div>
    </a-flex>
  </a-layout-sider>
</template>
