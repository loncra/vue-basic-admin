<script setup lang="ts">
import {computed, ref} from 'vue'
import {useRoute} from 'vue-router'
import type {ResourceSavePayload} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {SYSTEM_CONSTANT} from '@/constants'
import {resourceCore} from './resource.page'
import {resourceDetailPage} from './resource.detail.page'

/** 资源详情页薄壳：字段、标签、图标+名称、跨列数都在声明里；标题用实体名拼（旧 `titleText`） */
defineOptions({
  name: 'AuthServerResourceDetail',
})

const route = useRoute()
const detailRef = ref<{entity?: ResourceSavePayload}>()
/** pro 的壳不认路由：主键由页壳取出来传进去 */
const id = computed(() => route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined)

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**（旧 `BasicDetail` 的 `queryFields`） */
const {ok} = useRequiredQuery()

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
