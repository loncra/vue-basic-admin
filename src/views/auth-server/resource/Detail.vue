<script setup lang="ts">
import {CrudDetailPage} from '@/components/basic/page'
import {resourceDetailPage} from './resource.detail.page'

/** 资源详情页薄壳：字段、标签、图标+名称、跨列数都在声明里 */
defineOptions({
  name: 'AuthServerResourceDetail',
})
</script>

<template>
  <crud-detail-page :page="resourceDetailPage" />
</template>
