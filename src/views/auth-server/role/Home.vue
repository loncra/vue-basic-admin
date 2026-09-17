<script setup lang="ts">
import {CrudHomePage} from '@/components/basic/page'
import {rolePage} from './role.page'

defineOptions({
  name: 'AuthServerRoleHome',
})
</script>

<template>
  <!-- scroll 跟着旧 RoleTable 的 `:scroll="{x:'max-content'}"`，别省（列多了要能横向滚） -->
  <div>
    <crud-home-page :page="rolePage" :scroll="{x: 'max-content'}" />
  </div>
</template>
