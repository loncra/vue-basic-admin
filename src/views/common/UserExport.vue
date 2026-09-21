<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {userExportHomePage} from './user-export.home.page'

defineOptions({
  name: 'CommonUserExport',
})
</script>

<template>
  <crud-home-page :page="userExportHomePage" />
</template>
