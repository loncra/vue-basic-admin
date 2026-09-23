<script setup lang="ts">
import {ref} from 'vue'
import type {DataDictionaryEntity} from '@loncra/client/resource'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {dataDictionaryCore} from './data-dictionary.page'
import {dataDictionaryDetailPage} from './data-dictionary.detail.page'

/**
 * 字典数据详情页薄壳：字段、标签、枚举显示、跨列数全在声明（`data-dictionary.detail.page.ts`）；
 * 这里只剩三件宿主的事 —— 主键（pro 不认路由）、标题、离场。
 */
defineOptions({
  name: 'ResourceServerDataDictionaryDetail',
})

const detailRef = ref<{entity?: DataDictionaryEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照 —— 别再自己读 route，旧 `BasicDetail` 的 `queryFields` 就是这件事） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (name)` */
useEntityPageTitle(() => detailRef.value?.entity?.name)

/** 记录被删 ⇒ 回列表 + 关 tab */
const {onStale} = usePageExit({redirect: dataDictionaryCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="dataDictionaryDetailPage"
    @stale="onStale"
  />
</template>
