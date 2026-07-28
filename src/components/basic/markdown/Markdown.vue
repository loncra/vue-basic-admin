<script setup lang="ts">

import {XMarkdown} from "@antdv-next/x-markdown";

import "@antdv-next/x-markdown/themes/index.css";
import "@antdv-next/x-markdown/themes/light.css";
import "@antdv-next/x-markdown/themes/dark.css";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {CONFIG_PROVIDER_THEME} from "@/constants";

defineOptions({
  name: 'LMarkdown',
})

const configProviderStore = useConfigProviderStore()

</script>

<template>
  <x-markdown
    v-bind="$attrs"
    :class="configProviderStore.state.theme === CONFIG_PROVIDER_THEME.DARK ? 'x-markdown-dark' : 'x-markdown-light'"
  />
</template>

