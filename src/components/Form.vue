<script setup lang="ts">
import {antdvConfig} from '@/stores/antdvConfig'
import {ref} from 'vue'
import type {FormInstance} from 'antdv-next'


defineOptions({
  name: 'LForm',
})

const props = defineProps<{
  layout?: string
}>()
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
    :layout="props.layout || antdvConfig.state.formLayout"
  >
    <slot></slot>
  </a-form>
</template>
