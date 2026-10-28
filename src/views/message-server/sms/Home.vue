<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {smsHomePage} from './sms.home.page'

defineOptions({
  name: 'MessageServerSmsHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="smsHomePage" />
  </div>
</template>
