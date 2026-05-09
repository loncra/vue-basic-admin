<script setup lang="ts">
import LAuthorityOperateTable from '@/components/baisc/AuthorityOperateTable.vue'
import {ConsoleUserService} from '@/apis/auth-server/consoleUserService.ts'
import {ref} from 'vue'
import type {TableProps} from 'antdv-next'
import type {ConsoleUserEntity} from '@/types/auth-server/consoleUserType.ts'

defineOptions({
  name: 'LConsoleUserTableTable',
})

const service = new ConsoleUserService()
const columns = ref<TableProps<ConsoleUserEntity>>()
</script>

<template>
  <div>
    <l-authority-operate-table :service="service" :columns="columns"/>
  </div>
</template>
