<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {enterpriseRoleHomePage} from './enterprise-role.home.page'

defineOptions({
  name: 'AuthServerEnterpriseRoleHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="enterpriseRoleHomePage" />
  </div>
</template>
