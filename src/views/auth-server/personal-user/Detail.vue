<script setup lang="ts">
import {ref} from 'vue'
import type {PersonalUserEntity} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {personalUserCore} from './personal-user.page'
import {personalUserDetailPage} from './personal-user.detail.page'

/**
 * 个人用户详情页薄壳：字段、标签、枚举显示、跨列数全在声明（`personal-user.detail.page.ts`）；
 * 这里只剩三件宿主的事 —— 主键（pro 不认路由）、标题、离场。
 */
defineOptions({
  name: 'AuthServerPersonalUserDetail',
})

const detailRef = ref<{entity?: PersonalUserEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照 —— 别再自己读 route，旧 `BasicDetail` 的 `queryFields` 就是这件事） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (昵称 || 账号)` */
useEntityPageTitle(() => {
  const entity = detailRef.value?.entity
  return entity ? entity.nickname || entity.username || undefined : undefined
})

/** 记录被删 ⇒ 回列表 + 关 tab */
const {onStale} = usePageExit({redirect: personalUserCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="personalUserDetailPage"
    @stale="onStale"
  />
</template>
