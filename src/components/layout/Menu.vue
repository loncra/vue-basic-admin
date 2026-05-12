<script setup lang="ts">
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {ResourceEntity} from "@/types";
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
  getEnumValue,
  requireNonNullOrUndefined,
  unmergeTree
} from "@/utils";
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
  if (getEnumValue(item.type) === RESOURCE_TYPE.MENU) {
    return h(
        'span',
        {
          onClick: (e: MouseEvent) => {
            const page = item.page?.trim()
            if (!page) {
              return
            }
            e.preventDefault()
            e.stopPropagation()
            globalProperties.$router.push(page)
          }
        },
        String(item.name)
      )
  } else {
    return h('span', {}, String(item.name))
  }
}

function wrapIconWithMenuRoute(item: ResourceEntity, icon: VNode) {
  return h(
    icon,
    {
      onClick: (e: MouseEvent) => {
        const page = item.page?.trim()
        if (!page) {
          return
        }
        e.preventDefault()
        e.stopPropagation()
        globalProperties.$router.push(page)
      }
    }
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
    root-class="border-none"
    :classes="{itemContent: props.hideLabel ? 'm-0' : ''}"
    v-model:open-keys="menuOptions.openKeys"
    v-model:selected-keys="menuOptions.selectedKeys"
    :items="menuPrincipalStore.state.menu.filter(s => props.menuTypes.includes(getEnumValue(s.type)))"
    :label-render="props.hideLabel ? undefined : labelRender"
    :icon-render="iconRender"
    v-bind="$attrs"
  >
  </a-menu>
</template>
