<script setup lang="ts">
import {ref} from 'vue'
import type {DataDictionarySavePayload} from '@loncra/client/resource'
import {CrudFormPage} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {RESOURCE_SERVER_DATA_DICTIONARY_ROUTE} from '@/constants'
import {dataDictionaryFormPage, dictionaryFormContext} from './data-dictionary.form.page'

/**
 * 字典数据新增/编辑页薄壳。
 * 字段、校验、枚举选项、`code` 前缀、父数据/类型继承、编辑态剥前缀都在声明里；
 * 这里只剩宿主的事：主键、标题、离场。
 */
defineOptions({
  name: 'ResourceServerDataDictionaryForm',
})

/**
 * 入口校验 + 取参：`id`（编辑）/ `parentId`（在某条下面新增）/ `typeId`（在某个类型下新增）
 * **至少给一个**，一个都没有才跳 400（`{anyOf: true}`）。
 * 参数不齐时模板的 `v-if="ok"` 让表单壳**根本不挂载**；值同样是**快照**（进页面那一刻取一次）。
 */
const {ok, id} = useRequiredQuery(['id', 'parentId', 'typeId'], {anyOf: true})

const formRef = ref<{entity?: DataDictionarySavePayload}>()

/** 标题（旧 `setPageTitle` 三档）：父数据名 → 「类型: x, 名称: y」→ 类型名 */
useEntityPageTitle(() => {
  const {type, parent} = dictionaryFormContext.value
  const entity = formRef.value?.entity
  if (parent) {
    return parent.name
  }
  if (entity?.id) {
    return i18n.global.t('resourceServer.dataDictionary.editPage', {
      typeName: type?.name,
      dataName: entity.name,
    })
  }
  return type?.name
})

/**
 * 保存成功后的去向：**回列表并带上 `typeId`**（旧 `redirect` 的 `query`）——
 * `typeId` 要等取数才有 ⇒ 用函数形态（离场那一刻才求值）。
 */
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: () => ({
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.HOME,
    query: {typeId: formRef.value?.entity?.typeId},
  }),
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    v-if="ok"
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="dataDictionaryFormPage"
    @success="onSuccess"
    @stale="onStale"
  />
</template>
