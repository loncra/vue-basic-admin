<script setup lang="ts">
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {CrudFormPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {SYSTEM_CONSTANT} from '@/constants'
import {resourceCore} from './resource.page'
import {resourceFormPage} from './resource.form.page'

/**
 * 新增/编辑页薄壳。
 * 字段、按分类变化的条件规则/禁用、图标清单、父资源都归声明（resource.form.page.ts）；
 * 这里只把 parent ref 递进去，并用它 + 实体名拼标题（旧 `titleText` 的活）。
 */
defineOptions({
  name: 'AuthServerResourceForm',
})

const route = useRoute()
const formRef = ref<{entity?: ResourceSavePayload}>()
/** pro 的壳不认路由：主键由页壳取出来传进去（没有 = 新增） */
/** 主键：**进页面那一刻取一次**（快照）。别写 `computed` —— 那样 id 会跟着"当前路由"走：本实例若在路由切走后被重新挂载/重新激活，就会拿**别人的 id** 去取自己的数据 */
const id = route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined

const parent = ref<ResourceEntity>()
/** 声明里的 preMounted 通过 contextExtra 拿到它 */
const contextExtra = {parent}

/** 标题：addChild 用父资源名，编辑态用资源名，新增态不带（与旧 `titleText` 一致） */
useEntityPageTitle(
  () => parent.value?.name ?? (formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined),
)

/** 保存成功后的去向（编辑回列表 / 新增按偏好；关 tab + 记住偏好）—— pro 的壳只 emit('success') */
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: resourceCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="resourceFormPage"
    :context-extra="contextExtra"
    @success="onSuccess"
    @stale="onStale"
  />
</template>
