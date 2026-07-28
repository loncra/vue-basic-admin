<script setup lang="ts">

import {XMarkdown} from "@antdv-next/x-markdown";

import "@antdv-next/x-markdown/themes/index.css";
import "@antdv-next/x-markdown/themes/light.css";
import "@antdv-next/x-markdown/themes/dark.css";

defineOptions({
  name: 'LMarkdown',
})

</script>

<template>
  <x-markdown
    v-bind="$attrs"
  />
</template>

