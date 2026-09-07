<script setup lang="ts">

import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {ref} from "vue";

defineOptions({
  name: 'LQrCodeModal',
})

const configProviderStore = useConfigProviderStore()

const copy = ref<boolean>(false);
const open = defineModel<boolean>("open",{default:false})

const props = defineProps<{
  url:string
}>()

async function onCopy() {
  await navigator.clipboard.writeText(props.url || "");
  copy.value = true
}

function onCancel() {
  open.value = false
  copy.value = false
}

</script>

<template>
  <a-modal :open="open" :title="$t('common.shard')" :footer="null" @cancel="onCancel">
    <a-flex vertical gap="middle" align="center">
      <a-qrcode :value="props.url" :size="configProviderStore.getToken().sizeLG * 10"/>
      <a-space-compact block>
        <a-input disabled :value="props.url"/>
        <a-button variant="outlined" @click="onCopy" :color="copy ? 'cyan' : 'default'">
          <template #icon>
            <icon-font :type="copy ? 'loncra-copy-check' : 'loncra-copy'"></icon-font>
          </template>
          <span>{{$t('common.copy')}}</span>
        </a-button>
      </a-space-compact>
    </a-flex>
  </a-modal>
</template>
