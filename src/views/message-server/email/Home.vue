<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {emailHomePage} from './email.home.page'

/**
 * 邮件消息列表页薄壳：列、搜索、枚举来源、状态单元格、权限、发邮件按钮全在声明里
 * —— 旧 `EmailTable.vue` 那份手写表格已由 pro 的列表 DSL 取代。
 */
defineOptions({
  name: 'MessageServerEmailHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="emailHomePage" />
  </div>
</template>
