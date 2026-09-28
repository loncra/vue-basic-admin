<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {personalUserHomePage} from './personal-user.home.page'

/**
 * 个人用户列表页薄壳：列、搜索、枚举、权限、跳转全在声明里
 * —— 旧 `PersonalUserTable.vue` 那份手写表格已由 pro 的列表 DSL 取代。
 */
defineOptions({
  name: 'AuthServerPersonalUserHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="personalUserHomePage" />
  </div>
</template>
