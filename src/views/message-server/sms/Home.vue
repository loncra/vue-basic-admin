<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {smsHomePage} from './sms.home.page'

/**
 * 短信消息列表页薄壳：列、搜索、枚举来源、状态单元格、权限、三个跳转按钮全在声明里
 * —— 旧 `SmsTable.vue` 那份手写表格已由 pro 的列表 DSL 取代。
 */
defineOptions({
  name: 'MessageServerSmsHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="smsHomePage" />
  </div>
</template>
