<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {emailHomePage} from './email.home.page'

defineOptions({
  name: 'MessageServerEmailHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="emailHomePage" />
  </div>
</template>
