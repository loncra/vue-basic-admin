<script setup lang="ts">
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {ref} from 'vue'
import type {FormInstance} from 'antdv-next'


defineOptions({
  name: 'LForm',
})

const props = defineProps<{
  layout?: string
}>()
const configProviderStore = useConfigProviderStore()
const formRef = ref<FormInstance>()

defineExpose({
  validate: () => formRef.value?.validate(),
  resetFields: () => formRef.value?.resetFields(),
  clearValidate: () => formRef.value?.clearValidate(),
})
</script>

<template>
  <a-form
    ref="formRef"
    v-bind="$attrs"
    :layout="props.layout || configProviderStore.antdv.state.formLayout"
  >
    <slot></slot>
  </a-form>
</template>
