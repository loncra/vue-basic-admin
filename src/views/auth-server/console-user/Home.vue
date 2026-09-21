<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {consoleUserHomePage} from './console-user.home.page'

defineOptions({
  name: 'AuthServerConsoleUserHome',
})
</script>

<template>
  <crud-home-page :page="consoleUserHomePage" />
</template>
