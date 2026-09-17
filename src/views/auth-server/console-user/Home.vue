<script setup lang="ts">
import {CrudHomePage} from '@/components/basic/page'
import {consoleUserHomePage} from './console-user.home.page'

defineOptions({
  name: 'AuthServerConsoleUserHome',
})

</script>

<template>
  <crud-home-page :page="consoleUserHomePage" :scroll="{x: 'max-content'}" />
</template>
