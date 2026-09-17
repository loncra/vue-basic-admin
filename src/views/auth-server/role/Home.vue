<script setup lang="ts">
import {CrudHomePage} from '@/components/basic/page'
import {rolePage} from './role.page'

defineOptions({
  name: 'AuthServerRoleHome',
})
</script>

<template>
  <crud-home-page :page="rolePage" :scroll="{x: 'max-content', y: 350}" />
</template>
