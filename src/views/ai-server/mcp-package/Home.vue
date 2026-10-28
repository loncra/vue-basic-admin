<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {mcpPackageHomePage} from './mcp-package.home.page'

defineOptions({
  name: 'AiServerMcpPackageHome',
})
</script>

<template>
  <crud-home-page :page="mcpPackageHomePage" />
</template>
