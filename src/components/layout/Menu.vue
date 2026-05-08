<script setup lang="ts">
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {ResourceData} from "@/types";
import {type ComponentInternalInstance, getCurrentInstance, h, onMounted, ref, resolveComponent, watch} from "vue";
import type {RouteLocationNormalizedLoaded} from "vue-router";
import {createIcon, filterTreeDeep, requireNonNullOrUndefined, unmergeTree} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";

defineOptions({
  name: 'LMenu',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const menuPrincipalStore = useMenuPrincipalStore()

interface MenuState {
  selectedKeys:string[],
  openKeys:string[]
}

interface MenuProps {
  menuTypes: string[],
  hideLabel?: boolean
}

const props = withDefaults(defineProps<MenuProps>(), {
  menuTypes: () => [],
  inlineCollapsed: false
})

const menuOptions = ref<MenuState>({
  selectedKeys: [],
  openKeys: []
})

const collapsedAndSelectedMenu = (route: RouteLocationNormalizedLoaded) => {
  const data: ResourceData[] = filterTreeDeep<ResourceData>(
    (r) => r.page === route.path,
    menuPrincipalStore.state,
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
  const icon = createIcon(item.icon || 'icon-survey')
  if (!props.hideLabel) {
    return icon
  }
  const Tooltip = resolveComponent('ATooltip')
  return h(
    Tooltip,
    { title: String(item.name ?? '') },
    { default: () => icon },
  )
}

onMounted(() => collapsedAndSelectedMenu(globalProperties.$route))
</script>

<template>
    <a-menu
        root-class="border-e-0"
        :classes="{itemContent: props.hideLabel ? 'm-0' : ''}"
        v-model:open-keys="menuOptions.openKeys"
        v-model:selected-keys="menuOptions.selectedKeys"
        :items="menuPrincipalStore.state.filter((s) => props.menuTypes.includes(s.type.value))"
        :label-render="props.hideLabel ? undefined : labelRender"
        :icon-render="iconRender"
        v-bind="$attrs"
    >
    </a-menu>
</template>
