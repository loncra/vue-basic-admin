<script setup lang="ts">
import {useMenuPrincipalStore} from '@/stores/menuStore.js'
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import {requireNonNullOrUndefined} from '@/utils'
import LRecursionMenu from '@/components/layout/home/menu/RecursionMenu.vue'
import type {ResourceData} from "@/types";

defineOptions({
  name: 'LMenu',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const menuPrincipalStore = useMenuPrincipalStore()

interface MenuProps {
  /**
   * 标题
   */
  menuTypes: string[]
}

interface MenuState {
  selectedKeys:string[],
  openKeys:string[],
  data: ResourceData[],
}

const props = withDefaults(defineProps<MenuProps>(), {
  menuTypes: () => [],
})

const menuOptions = ref<MenuState>({
  selectedKeys: [],
  openKeys: [],
  data:[],
})

/*const getItemKey = (item: ResourceData) => {
  return `${item.type}_${item.id}`
}

const collapsedAndSelectedMenu = (route: RouteLocationNormalizedLoaded) => {
  const data: ResourceData[] = filterTreeDeep<ResourceData>(
    (r) => menuPrincipalStore.replaceValue(r) === route.path,
    menuPrincipalStore.state,
  )
  if (data.length <= 0) {
    return
  }
  const unmergeData: ResourceData[] = unmergeTree<ResourceData>(data)
  const values: string[] = unmergeData.map(getItemKey)
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

onMounted(() => collapsedAndSelectedMenu(globalProperties.$route))

function getMenuData() {
  return convertObject(
    menuPrincipalStore.state.filter((s) => props.menuTypes.includes(s.type)),
    {
      fieldMappings: { id: 'key', name: 'label' },
      preserveFields: ['value', 'applicationName', 'type', 'icon', 'id'],
      childrenField: 'children',
      valueTransformers: {
        key: (_, item) => getItemKey(item),
      },
    },
  )
}

function labelRender(item: unknown) {
  if (item == null || typeof item !== 'object' || !('label' in item)) {
    return
  }
  const label = (item as { label?: unknown }).label
  return h('span', {}, String(label ?? ''))
}

function iconRender(item: unknown) {
  if (item == null || typeof item !== 'object' || !('icon' in item)) {
    return
  }
  const icon = (item as { icon?: unknown }).icon
  return createIcon((typeof icon === 'string' ? icon : 'icon-survey') || 'icon-survey')
}

function onClick(info: { key: string }) {
  const menuData = unmergeTree(getMenuData()) as unknown as ResourceData[]
  const menu = menuData.find((s) => getItemKey(s) === info.key)
  if (!menu || menu.type !== RESOURCE_TYPE.MENU) {
    return
  }
  globalProperties.$router.push({ path: menuPrincipalStore.replaceValue(menu) })
}*/

const mounted = async () => {
  menuOptions.value.data = await menuPrincipalStore.getPrincipalResources(props.menuTypes)
}

onMounted(mounted)
</script>

<template>
  <a-menu
    :classes="{root:'border-e-0'}"
    v-model:open-keys="menuOptions.openKeys"
    v-model:selected-keys="menuOptions.selectedKeys"
    v-bind="$attrs"
  >
    <l-recursion-menu :data="menuOptions.data"/>
  </a-menu>
</template>
