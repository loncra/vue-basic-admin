<script setup lang="ts">
import {ref} from 'vue'
import type {SmsMessageEntity} from '@loncra/client/message'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {smsCore} from './sms.page'
import {smsDetailPage} from './sms.detail.page'

/**
 * 短信消息详情页薄壳：字段、标签、枚举显示、跨列数、操作记录都在声明（`sms.detail.page.ts` / `sms.page.ts`）；
 * 这里只剩三件宿主的事 —— 主键（pro 不认路由）、标题、离场。
 */
defineOptions({
  name: 'MessageServerSmsDetail',
})

const detailRef = ref<{entity?: SmsMessageEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (id)` */
useEntityPageTitle(() => {
  const entityId = detailRef.value?.entity?.id
  return entityId == null ? undefined : String(entityId)
})

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: smsCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="smsDetailPage"
    @stale="onStale"
  />
</template>
