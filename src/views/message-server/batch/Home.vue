<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {batchHomePage} from './batch.home.page'

defineOptions({
  name: 'MessageServerBatchHome',
})
</script>

<template>
  <crud-home-page :page="batchHomePage" />
</template>
