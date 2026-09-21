<script setup lang="ts">
import {CrudHomePage as LCrudHomePage} from '@loncra/antdv-pro'
import {mcpPackageHomePage} from './mcp-package.home.page'

defineOptions({
  name: 'AiServerMcpPackageHome',
})
</script>

<template>
  <div>
    <l-crud-home-page :page="mcpPackageHomePage" />
  </div>
</template>
