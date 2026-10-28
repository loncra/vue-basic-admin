<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseInvitationEntity} from '@loncra/client/auth'
import {
  AUTH_SERVER_AUDIT_TYPE_VALUE,
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY
} from '@loncra/client/auth'
import {AUDIT_STATUS_VALUE, getEnumValue} from '@loncra/client/commons'
import {QrCodeModal} from '@loncra/antdv'
import {CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import {renderIconFont} from '@/utils'
import LEnterpriseInvitationModal from '@/views/auth-server/enterprise-invitation/Form.vue'
import LEnterpriseMemberAuditModal from '@/views/auth-server/enterprise-invitation/Audit.vue'
import {
  enterpriseMemberAudit,
  enterpriseMemberHomePage,
  memberAuditRecordActions,
  memberAuditToolbarActions,
} from '@/views/auth-server/enterprise-member/enterprise-member.home.page'
import {
  ENTERPRISE_MEMBER_VARIANT
} from '@/views/auth-server/enterprise-member/enterprise-member.page'
import {enterpriseInvitationHomePage, invitationShare,} from './enterprise-invitation.home.page'

defineOptions({
  name: 'AuthServerEnterpriseInvitationHome',
})

const table = ref<CrudHomePageExpose<EnterpriseInvitationEntity>>()

const memberTableKey = ref(0)

const form = ref<{open: boolean; id?: number}>({open: false})

function openForm(record?: EnterpriseInvitationEntity): void {
  form.value = {open: true, id: record?.id}
}
</script>

<template>
  <div>
    <crud-home-page
      ref="table"
      :page="enterpriseInvitationHomePage"
      :expandable="{
        rowExpandable: (record: EnterpriseInvitationEntity) =>
          getEnumValue(record.auditType) === AUTH_SERVER_AUDIT_TYPE_VALUE.MANUAL,
      }"
      @add="openForm()"
      @edit="openForm"
    >
      <template #expandedRowRender="{record}">
        <!--
          展开行里是**审核态的成员表**（同一个成员声明 + `variant: 'audit'`）。
          动作上下文里没有 `variant` ⇒ 两组动作由声明导出、这里覆盖传下去（声明里的那组是整页管理的）。
          `plain` = 内嵌形态：不要卡片壳、也不要外层 Spin（加载态归表格自己的 `loading`）；
          标题落到表格自带标题（`.ant-table-title`）⇒ 与表格同进同退，不再被 antd 的嵌套表规则拉歪。
        -->
        <crud-home-page
          :key="memberTableKey"
          :page="enterpriseMemberHomePage"
          :variant="ENTERPRISE_MEMBER_VARIANT.AUDIT"
          plain
          :query="{
            'filter_[invitation_id_eq]': record.id,
            'filter_[audit_status_eq]': AUDIT_STATUS_VALUE.AUDITABLE,
          }"
          :record-actions="memberAuditRecordActions"
          :toolbar-actions="memberAuditToolbarActions"
          :authority="{delete: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.DELETE}"
        >
          <template #title>
            <a-space>
              <component :is="() => renderIconFont('loncra-user-check', 'align')" />
              {{ $t('authServer.enterpriseInvitation.invitedMembers') }}
            </a-space>
          </template>
        </crud-home-page>
      </template>
    </crud-home-page>

    <teleport v-if="form.open || invitationShare.open || enterpriseMemberAudit.open" to="body">
      <l-enterprise-invitation-modal
        v-if="form.open"
        v-model:open="form.open"
        :id="form.id"
        @success="table?.fetchDataSource()"
      />

      <l-enterprise-member-audit-modal
        v-if="enterpriseMemberAudit.open"
        @success="memberTableKey += 1"
      />

      <qr-code-modal
        v-if="invitationShare.open"
        v-model:open="invitationShare.open"
        :url="invitationShare.url"
      />
    </teleport>
  </div>
</template>
