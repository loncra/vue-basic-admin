<script setup lang="ts">
defineOptions({
  name: 'LLayoutFooter',
})

const version = import.meta.env.VITE_APP_VERSION_VALUE
</script>

<template>
  <a-layout-footer class="p-md text-center">
    <a-typography-text>
      COPYRIGHT © 2026 loncra, All rights ReservedHand-crafted & Made with {{ version }}
    </a-typography-text>
  </a-layout-footer>
</template>
