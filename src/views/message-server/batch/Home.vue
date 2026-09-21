<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {batchHomePage} from './batch.home.page'

defineOptions({
  name: 'MessageServerBatchHome',
})
</script>

<template>
  <div>
    <crud-home-page
      :page="batchHomePage"
      :scroll="{x:'max-content'}"
    />
  </div>
</template>
