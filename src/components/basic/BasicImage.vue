<script setup lang="ts">

import notFound from "@/assets/ImageNotFound.svg";

defineOptions({
  name: 'LBasicImage',
})

</script>

<template>
  <a-flex class="size-full" align="center" justify="center">
    <a-image
      v-bind="$attrs"
      class="size-full object-cover"
      :fallback="notFound"
    />
  </a-flex>
</template>
