<script setup lang="ts">
import {useFormItemInputContext} from "antdv-next/dist/form/context";
import {computed} from "vue";

defineOptions({
  name: 'LTooltipValidationFormItem',
})

const itemStatus = useFormItemInputContext()
const errorTitle = computed(() => {
  const first = itemStatus.value.errors?.[0]
  return first ? String(first) : undefined
})

</script>

<template>
  <a-tooltip :title="errorTitle">
    <slot></slot>
  </a-tooltip>
</template>
