<script setup lang="ts">
import {ref} from "vue";
import LTipTapToolbarButton from "@/components/tiptap/TipTapToolbarButton.vue";

defineOptions({
  name: 'LTipTapToolbarButtonPopover',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  label:string
}>(),{
  label:'',
})

const modelValue = ref<string>('')

const open = ref<boolean>(false);

function confirm() {
  emit("confirm", modelValue.value)
  open.value = false;
}

const emit = defineEmits<{
  confirm: [value: string]
}>()

</script>

<template>
  <a-popover :open="open" placement="bottom">
    <l-tip-tap-toolbar-button @click="open = true" v-bind="$attrs" />
    <template #content>
      <a-space-compact>
        <a-space-addon>{{props.label}}:</a-space-addon>
        <a-input class="w-90" v-model:value="modelValue" />
        <a-button type="primary" @click="confirm">
          确定
        </a-button>
        <a-button @click="open = false">
          取消
        </a-button>
      </a-space-compact>
    </template>
  </a-popover>
</template>
