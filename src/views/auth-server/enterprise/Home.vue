<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {enterpriseHomePage} from './enterprise.home.page'

defineOptions({
  name: 'AuthServerEnterpriseHome',
})
</script>

<template>
  <div>
    <crud-home-page
      :page="enterpriseHomePage"
      :scroll="{x:'max-content'}"
    />
  </div>
</template>
