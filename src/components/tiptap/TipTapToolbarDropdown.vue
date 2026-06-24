<script setup lang="ts">
import type {TipTapToolbarDropdownOption, TipTapToolbarSize} from '@/types/composables/tiptap'
import {computed} from "vue";

defineOptions({
  name: 'LTipTapToolbarDropdown',
})

const props = withDefaults(
  defineProps<{
    options?: TipTapToolbarDropdownOption[]
    active?:boolean,
    disabled?: boolean
    size?: TipTapToolbarSize
  }>(),
  {
    options: () => [],
    disabled: false,
    size: 'small',
  },
)

const emit = defineEmits<{
  select: [value: string]
}>()

const modelValue = defineModel<string>('value',{default:""});

function onMenuClick(e: { key: string}) {
  modelValue.value = e.key;
  emit('select', e.key)
}

const currentValue = computed(() => {
  const options = props.options.filter(o => o != null);
  const data = options.find(o => o.key === modelValue.value)
  if (data) {
    return data
  } else {
    return options.at(0)
  }
})

</script>

<template>
  <a-dropdown
    :disabled="disabled"
    :trigger="['click']"
    :menu="{items:props.options.map(r => ({label: r.label,iconFont:r.icon, key: r.key}))}"
    @menu-click="onMenuClick"
  >
    <a-button :type="active ? 'primary' : 'text'" class="mb-[1px]" :size="size" :disabled="disabled">
      <a-space v-if="currentValue">
        <icon-font v-if="currentValue.icon" class="icon align" :type="currentValue.icon" />
        {{ currentValue?.label }}
        <icon-font class="icon align" type="loncra-chevron-down" />
      </a-space>
    </a-button>

    <template #labelRender="item">
      <a-space>
        <icon-font v-if="item.iconFont" class="icon align" :type="item.iconFont" />
        {{ item?.label }}
      </a-space>
    </template>
  </a-dropdown>
</template>
