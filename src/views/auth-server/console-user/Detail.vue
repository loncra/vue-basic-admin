<script setup lang="ts">
import {CrudDetailPage} from '@/components/basic/page'
import {consoleUserDetailPage} from './console-user.detail.page'

defineOptions({
  name: 'AuthServerConsoleUserDetail',
})

</script>

<template>
  <crud-detail-page :page="consoleUserDetailPage" />
</template>
