<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {enterpriseRoleHomePage} from './enterprise-role.home.page'

/**
 * 企业角色列表页薄壳：列、搜索、权限、动作（含 addChild）、跳转全在声明里
 * —— 旧 `EnterpriseRoleTable.vue` 那份手写表格已由 pro 的列表 DSL 取代。
 */
defineOptions({
  name: 'AuthServerEnterpriseRoleHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="enterpriseRoleHomePage" />
  </div>
</template>
