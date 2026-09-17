<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceEntity} from '@loncra/client/auth'
import {CrudFormPage} from '@/components/basic/page'
import {resourceFormPage} from './resource.form.page'

/**
 * 新增/编辑页薄壳。
 * 字段、按分类变化的条件规则/禁用、图标清单、父资源都归声明（resource.page.ts）；
 * 这里只把 parent ref 递进去（标题要用它）。
 */
defineOptions({
  name: 'AuthServerResourceForm',
})

const parent = ref<ResourceEntity>()
/** 声明里的 preMounted / titleText 通过 contextExtra 拿到它 */
const contextExtra = {parent}
</script>

<template>
  <crud-form-page :page="resourceFormPage" :context-extra="contextExtra" />
</template>
