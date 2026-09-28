<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseInvitationEntity} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {AuthServerService} from '@/apis'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {enterpriseInvitationCore} from './enterprise-invitation.page'
import {enterpriseInvitationDetailPage} from './enterprise-invitation.detail.page'

/**
 * 企业邀请详情页薄壳：字段、邀请人（头像 + 显示名）、枚举显示、过期兜底、跨列数、操作记录都在声明里；
 * 这里只剩三件宿主的事 —— 主键（pro 不认路由）、标题、离场。
 */
defineOptions({
  name: 'AuthServerEnterpriseInvitationDetail',
})

const detailRef = ref<{entity?: EnterpriseInvitationEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (邀请人)` —— 有成员用成员名，否则用 principal */
useEntityPageTitle(() => {
  const entity = detailRef.value?.entity
  if (!entity) {
    return undefined
  }
  return entity.member
    ? AuthServerService.getPrincipalNameByUserDetails(entity.member)
    : entity.principal
})

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: enterpriseInvitationCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="enterpriseInvitationDetailPage"
    @stale="onStale"
  />
</template>
