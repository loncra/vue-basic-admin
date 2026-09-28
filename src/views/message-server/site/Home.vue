<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {siteHomePage} from './site.home.page'

/**
 * 站内信列表页薄壳：列、搜索、枚举来源、状态/可推送单元格、权限、发站内信按钮全在声明里
 * —— 旧 `SiteTable.vue` 那份手写表格已由 pro 的列表 DSL 取代。
 */
defineOptions({
  name: 'MessageServerSiteHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="siteHomePage" />
  </div>
</template>
