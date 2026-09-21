<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {templateHomePage} from './template.home.page'

defineOptions({
  name: 'MessageServerSmsTemplateHome',
})
</script>

<template>
  <crud-home-page
    :page="templateHomePage"
    :scroll="{x:'max-content'}"
  />
</template>
