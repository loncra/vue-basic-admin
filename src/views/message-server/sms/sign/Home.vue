<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {signHomePage} from './sign.home.page'

defineOptions({
  name: 'MessageServerSmsSignHome',
})
</script>

<template>
  <crud-home-page
    :page="signHomePage"
    :scroll="{x:'max-content'}"
  />
</template>
