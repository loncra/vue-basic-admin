<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseMemberEntity} from '@loncra/client/auth'
import {CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import LEnterpriseInvitationModal from '@/views/auth-server/enterprise-invitation/Form.vue'
import LEnterpriseMemberAuditModal from '@/views/auth-server/enterprise-invitation/Audit.vue'
import {
  enterpriseMemberAudit,
  enterpriseMemberHomePage,
  enterpriseMemberInvitation,
} from './enterprise-member.home.page'

/**
 * 企业成员列表页薄壳：列、搜索、枚举来源、动作（编辑 / 删除 / 重置密码 / 邀请）、跳转都在声明里；
 * 这里只剩两件宿主的事 —— 两个弹层（发起邀请、审核成员）。
 *
 * ⚠️ 邀请弹层的 `auditTypeOptions` 已经删了（2026-09-30）：那个下拉的 options 现在由**表单声明的
 * `enumRef`** 自己拉，不用宿主再把列表的桶算好递进去。
 */
defineOptions({
  name: 'AuthServerEnterpriseMemberHome',
})

const table = ref<CrudHomePageExpose<EnterpriseMemberEntity>>()
</script>

<template>
  <div>
    <crud-home-page ref="table" :page="enterpriseMemberHomePage" />

    <teleport v-if="enterpriseMemberInvitation.open || enterpriseMemberAudit.open" to="body">
      <l-enterprise-invitation-modal
        v-if="enterpriseMemberInvitation.open"
        v-model:open="enterpriseMemberInvitation.open"
        @success="table?.fetchDataSource()"
      />

      <l-enterprise-member-audit-modal
        v-if="enterpriseMemberAudit.open"
        @success="table?.fetchDataSource()"
      />
    </teleport>
  </div>
</template>
