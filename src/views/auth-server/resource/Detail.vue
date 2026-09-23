<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceSavePayload} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {resourceCore} from './resource.page'
import {resourceDetailPage} from './resource.detail.page'

/** 资源详情页薄壳：字段、标签、图标+名称、跨列数都在声明里；标题用实体名拼（旧 `titleText`） */
defineOptions({
  name: 'AuthServerResourceDetail',
})

const detailRef = ref<{entity?: ResourceSavePayload}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照 —— 别再自己读 route，旧 `BasicDetail` 的 `queryFields` 就是这件事） */
const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: resourceCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="resourceDetailPage"
    @stale="onStale"
  />
</template>
