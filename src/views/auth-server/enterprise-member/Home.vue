<script setup lang="ts">
import {computed, ref} from 'vue'
import type {EnterpriseMemberEntity} from '@loncra/client/auth'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import {CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import LEnterpriseInvitationModal from '@/components/auth-server/EnterpriseInvitationModal.vue'
import LEnterpriseMemberAuditModal from '@/components/auth-server/EnterpriseMemberAuditModal.vue'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@/constants'
import {
  enterpriseMemberAudit,
  enterpriseMemberHomePage,
  enterpriseMemberInvitation,
} from './enterprise-member.home.page'

/**
 * 企业成员列表页薄壳：列、搜索、枚举来源、动作（编辑 / 删除 / 重置密码 / 邀请）、跳转都在声明里；
 * 这里只剩两件宿主的事 —— 两个弹层（发起邀请、审核成员）。
 */
defineOptions({
  name: 'AuthServerEnterpriseMemberHome',
})

const table = ref<CrudHomePageExpose<EnterpriseMemberEntity>>()

/**
 * 邀请弹层的「审核类型」下拉：直接吃声明里 `enums` 拉回来的枚举桶（**不另发请求**）。
 * 桶条目值是 `string | number`，而审核类型在库里就是数字 ⇒ 收窄一次。
 * （`buckets` 是 expose 出来的**值**，Vue 会解包 ⇒ 不许再写 `.value`）
 */
const auditTypeOptions = computed(
  () =>
    (table.value?.buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
      SYSTEM_ENUM_TYPE.AUDIT_TYPE_ENUM
    ] ?? []) as NameValueEnumMetadata<number>[],
)
</script>

<template>
  <div>
    <crud-home-page ref="table" :page="enterpriseMemberHomePage" />

    <teleport v-if="enterpriseMemberInvitation.open || enterpriseMemberAudit.open" to="body">
      <l-enterprise-invitation-modal
        v-if="enterpriseMemberInvitation.open"
        v-model:open="enterpriseMemberInvitation.open"
        v-model:entity="enterpriseMemberInvitation.entity"
        :audit-type-options="auditTypeOptions"
        @success="table?.fetchDataSource()"
      />

      <l-enterprise-member-audit-modal
        v-if="enterpriseMemberAudit.open"
        @success="table?.fetchDataSource()"
      />
    </teleport>
  </div>
</template>
