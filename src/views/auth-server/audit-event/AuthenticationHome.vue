<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {authenticationHomePage} from './authentication.home.page'

defineOptions({
  name: 'AuthServerAuthenticationEventHome',
})
</script>

<template>
  <crud-home-page :page="authenticationHomePage" />
</template>
