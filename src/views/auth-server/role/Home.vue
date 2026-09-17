<script setup lang="ts">
import {CrudHomePage} from '@/components/basic/page'
import {roleHomePage} from './role.home.page'

defineOptions({
  name: 'AuthServerRoleHome',
})
</script>

<template>
  <crud-home-page
    :pagination="false"
    :page="roleHomePage"
  />
</template>
