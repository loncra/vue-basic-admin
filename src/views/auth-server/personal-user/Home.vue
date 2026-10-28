<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {personalUserHomePage} from './personal-user.home.page'

defineOptions({
  name: 'AuthServerPersonalUserHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="personalUserHomePage" />
  </div>
</template>
