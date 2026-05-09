<script setup lang="ts">
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {ResourceEntity} from "@/types";
import {
  type ComponentInternalInstance,
  type VNode,
  getCurrentInstance,
  h,
  onMounted,
  ref,
  resolveComponent,
  watch
} from "vue";
import {type RouteLocationNormalizedLoaded, RouterLink} from "vue-router";
import {createIcon, filterTreeDeep, requireNonNullOrUndefined, unmergeTree} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";

defineOptions({
  name: 'LMenu',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const menuPrincipalStore = useMenuPrincipalStore()

const props = withDefaults(defineProps<{
  menuTypes: string[],
  hideLabel?: boolean
}>(), {
  menuTypes: () => [],
  inlineCollapsed: false
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
    (r) => r.page === route.path,
    menuPrincipalStore.state,
  )
  if (data.length <= 0) {
    return
  }
  const unmergeData: ResourceEntity[] = unmergeTree<ResourceEntity>(data)
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
  {deep: true},
)

function labelRender(item: ResourceEntity) {

  if (item == null || typeof item !== 'object') {
    return
  }
  if (item.type.value === RESOURCE_TYPE.MENU) {
    const page = item.page?.trim()
    if (!page) {
      return h('span', {}, String(item.name))
    }
    return h(RouterLink, {to: page}, () => String(item.name))
  } else {
    return h('span', {}, String(item.name))
  }
}

function wrapIconWithMenuRoute(item: ResourceEntity, icon: VNode) {
  const page = item.page?.trim()
  if (!page) {
    return icon
  }
  return h(
    RouterLink,
    {to: page},
    () => icon,
  )
}

function iconRender(item: ResourceEntity) {
  const icon = createIcon(item.icon || 'icon-survey')
  const linkedIcon = wrapIconWithMenuRoute(item, icon)
  if (!props.hideLabel) {
    return linkedIcon
  }
  const Tooltip = resolveComponent('ATooltip')
  return h(
    Tooltip,
    {title: String(item.name ?? '')},
    {default: () => linkedIcon},
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
