<script setup lang="ts">
import type {ItemType, MenuItemType} from "antdv-next/dist/menu/interface";
import {computed} from "vue";
import type {MenuInfo} from "@v-c/menu";
import type {MenuProps} from "antdv-next";

defineOptions({
  name: 'LActionButton',
})

const props = withDefaults(
  defineProps<{
    actionItems: NonNullable<MenuProps['items']>
  }>(),
  {
    actionItems: () => [],
  },
)

const emit = defineEmits<{
  actionItemClick: [string]
}>()

function toLoneFlatMenuItem(item: ItemType | undefined): MenuItemType | null {
  if (!item || item.type === "divider" || !("icon" in item) || !("label" in item) || item.icon == null) {
    return null
  }
  if ("children" in item) {
    return null
  }
  return item as MenuItemType
}

const loneMenuItem = computed<MenuItemType | null>(() => {
  const list = props.actionItems
  if (list.length !== 1) {
    return null
  }
  return toLoneFlatMenuItem(list[0])
})

function dispatchMenuKey(key: string) {
  emit('actionItemClick', key)
}

function handleActionClick(e: MenuInfo) {
  dispatchMenuKey(e.key)
}
</script>

<template>
  <a-dropdown
    v-if="actionItems.length > 1"
    placement="bottomRight"
    :menu="{ items: actionItems, onClick: handleActionClick }"
  >
    <a-button v-bind="$attrs">
      <template #icon>
        <icon-font class="icon" type="icon-more"/>
      </template>
    </a-button>
  </a-dropdown>
  <template v-else-if="actionItems.length === 1">
    <a-button v-bind="$attrs" @click="dispatchMenuKey(String(loneMenuItem?.key ?? ''))">
      <template #icon>
        <component
          class="icon align"
          :is="typeof loneMenuItem?.icon === 'function' ? loneMenuItem?.icon() : loneMenuItem?.icon"
        />
      </template>
      <span>
        {{ loneMenuItem?.label }}
      </span>
    </a-button>
  </template>
</template>
