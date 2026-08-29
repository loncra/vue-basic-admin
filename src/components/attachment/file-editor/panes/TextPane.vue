<script setup lang="ts">
import CodeEditor from '../CodeEditor.vue'

defineOptions({
  name: 'LFileTextPane',
})

defineProps<{
  ext: string
  readonly: boolean
}>()

const content = defineModel<string>({default: ''})
</script>

<template>
  <CodeEditor
    v-model="content"
    class="size-full min-h-0"
    :ext="ext"
    :readonly="readonly"
  />
</template>
