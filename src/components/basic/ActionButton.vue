<script setup lang="ts">
import {computed} from "vue";
import type {MenuInfo} from "@v-c/menu";
import type {ResolvedAction} from "@/types/composables";

defineOptions({
  name: 'LActionButton',
})

const props = withDefaults(
  defineProps<{
    actions: ResolvedAction[]
    size?: string
    alwaysDropdown?: boolean
  }>(),
  {
    actions: () => [],
    size: 'small',
    alwaysDropdown: false,
  },
)

const emit = defineEmits<{
  action: [id: string]
}>()

const loneAction = computed(() => {
  if (props.actions.length !== 1) {
    return null
  }
  return props.actions[0] ?? null
})

const menuItems = computed(() =>
  props.actions.map((action) => ({
    key: action.id,
    label: action.label,
    danger: action.danger,
    icon: action.icon ? () => action.icon : undefined,
    disabled: action.disabled,
  })),
)

function dispatchAction(action: ResolvedAction) {
  if (action.disabled) {
    return
  }
  action.run?.()
  emit('action', action.id)
}

function handleMenuClick(e: MenuInfo) {
  const action = props.actions.find((item) => item.id === String(e.key ?? ''))
  if (action) {
    dispatchAction(action)
  }
}
</script>

<template>
  <a-dropdown
    v-if="actions.length > 1 || alwaysDropdown"
    placement="bottomRight"
    :menu="{ items: menuItems, onClick: handleMenuClick }"
  >
    <a-button :size="props.size" v-bind="$attrs">
      <template #icon>
        <icon-font class="icon" type="loncra-ellipsis"/>
      </template>
    </a-button>
  </a-dropdown>
  <template v-else-if="loneAction">
    <a-button
      :size="props.size"
      v-bind="$attrs"
      :disabled="loneAction.disabled"
      :loading="loneAction.loading"
      @click="dispatchAction(loneAction)"
    >
      <template #icon>
        <component class="icon align" :is="loneAction.icon"/>
      </template>
      <span>{{ loneAction.label }}</span>
    </a-button>
  </template>
</template>
