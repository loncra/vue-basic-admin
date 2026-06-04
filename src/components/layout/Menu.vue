<script setup lang="ts">
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {ResourceEntity} from "@/types/apis";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  onMounted,
  ref,
  resolveComponent,
  type VNode,
  watch
} from "vue";
import {type RouteLocationNormalizedLoaded} from "vue-router";
import {
  createIcon,
  filterTreeDeep,
  findFirstTreeNode,
  getEnumValue,
  requireNonNullOrUndefined,
  unmergeTree
} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import type {MenuInfo} from '@v-c/menu'

defineOptions({
  name: 'LMenu',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const menuPrincipalStore = useMenuPrincipalStore()

const props = withDefaults(defineProps<{
  menuTypes: string[]
  hideLabel?: boolean
  badges?:string[]
  itemRender?:(item:ResourceEntity, node:VNode) => VNode
  badgeRender?:(item:ResourceEntity) => Record<string, unknown>
}>(), {
  menuTypes: () => [],
  inlineCollapsed: false,
  itemRender:(item:ResourceEntity, node:VNode) => node,
  badgeRender:(item:ResourceEntity) => ({})
})

const menuOptions = ref<
  {
    selectedKeys: string[],
    openKeys: string[]
  }
>({
  selectedKeys: [],
  openKeys: []
})

const collapsedAndSelectedMenu = (route: RouteLocationNormalizedLoaded) => {
  const data: ResourceEntity[] = filterTreeDeep<ResourceEntity>(
    (r) => r.page === route.path || r.page === (route?.meta?.parent || ''),
    menuPrincipalStore.state.menu,
  )
  if (data.length <= 0) {
    return
  }
  const unmergeData: ResourceEntity[] = unmergeTree<ResourceEntity>(data)
  if (unmergeData.length <= 0) {
    return
  }

  menuOptions.value.selectedKeys = unmergeData.filter(m => [RESOURCE_TYPE.MENU, RESOURCE_TYPE.TOOL].includes(getEnumValue(m.type) as 'menu' | 'tool')).map(m => m.id).map(String)

  const openKeys = unmergeData.filter(m => [RESOURCE_TYPE.ROOT, RESOURCE_TYPE.DIRECTORY].includes(getEnumValue(m.type) as 'root' | 'directory')).map(m => m.id).map(String)
  menuOptions.value.openKeys = [...new Set([...menuOptions.value.openKeys, ...openKeys])]
}

// 监听路由变化：路由变化 => 对应分段激活或追加
watch(
  () => globalProperties.$route.fullPath,
  () => collapsedAndSelectedMenu(globalProperties.$route)
)

function labelRender(item: ResourceEntity) {
  if (item == null || typeof item !== 'object') {
    return
  }
  const node:VNode = h('span', {}, String(item.name))
  return props?.itemRender(item, node) || node;
}

function iconRender(item: ResourceEntity) {
  const icon = createIcon(item.icon || 'loncra-file')
  let trigger = icon
  if (props.badges && props.badges.includes(item.code)) {
    const badge = resolveComponent('ABadge')
    trigger = h(badge, {...props.badgeRender(item)}, () => icon)
  }
  const tooltip = resolveComponent('ATooltip')
  const node:VNode =  h(
    tooltip,
    {title: String(item.name ?? '')},
    {default: () => trigger},
  )
  return props?.itemRender(item, node) || node;
}

function handleClick(e: MenuInfo) {
  const item: ResourceEntity | undefined = findFirstTreeNode<ResourceEntity>(
    (r) => r.key === e.key,
    menuPrincipalStore.state.menu,
  )
  if (item == null || typeof item !== 'object') {
    return
  }
  const page = item.page?.trim()
  if (!page) {
    return
  }
  globalProperties.$router.push(page)
}

onMounted(() => collapsedAndSelectedMenu(globalProperties.$route))
</script>

<template>
  <a-spin
    :spinning="menuPrincipalStore.state.loading"
    v-if="$attrs.mode === 'inline' && menuPrincipalStore.state.loading"
    class="flex h-full min-h-0 flex-col"
  >
    <a-flex vertical class="h-full min-h-0" />
  </a-spin>
  <a-menu
    v-else
    @click="handleClick"
    root-class="border-none"
    :classes="{itemContent: props.hideLabel ? 'm-0' : ''}"
    v-model:open-keys="menuOptions.openKeys"
    v-model:selected-keys="menuOptions.selectedKeys"
    :items="filterTreeDeep((s:ResourceEntity) => props.menuTypes.includes(getEnumValue(s.type)),menuPrincipalStore.state.menu)"
    :label-render="props.hideLabel ? undefined : labelRender"
    :icon-render="iconRender"
    v-bind="$attrs"
  >
  </a-menu>
</template>
