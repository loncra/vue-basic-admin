<script setup lang="ts">
import {computed, type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import {AUTH_SERVER_AUDIT_TYPE_VALUE} from '@loncra/client/auth'
import type {EnterpriseInvitationEntity} from '@loncra/client/auth'
import {AUDIT_STATUS_VALUE, getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {QrCodeModal as LQrCodeModal} from '@loncra/antdv'
import {CrudHomePage as LCrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {EnterpriseInvitationSavePayload} from '@/types/apis'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@/constants'
import {renderIconFont, requireNonNullOrUndefined} from '@/utils'
import LEnterpriseInvitationModal, {
  createEmptyForm,
} from '@/components/auth-server/EnterpriseInvitationModal.vue'
import {CrudHomePage} from '@loncra/antdv-pro'
import LEnterpriseMemberAuditModal from '@/components/auth-server/EnterpriseMemberAuditModal.vue'
import {AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY} from '@/constants'
import {
  enterpriseMemberAudit,
  enterpriseMemberHomePage,
  memberAuditRecordActions,
  memberAuditToolbarActions,
} from '@/views/auth-server/enterprise-member/enterprise-member.home.page'
import {ENTERPRISE_MEMBER_VARIANT} from '@/views/auth-server/enterprise-member/enterprise-member.page'
import {
  enterpriseInvitationHomePage,
  invitationShare,
} from './enterprise-invitation.home.page'

defineOptions({
  name: 'AuthServerEnterpriseInvitationHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

/**
 * 表格实例：`buckets` 是声明里 `list.enums` 拉回来的枚举桶，
 * 「审核类型」下拉直接用这一份（不再自己发请求）。
 */
const table = ref<CrudHomePageExpose<EnterpriseInvitationEntity>>()
const auditTypeOptions = computed(
  // 桶条目的 value 是 `string | number`，而「审核类型」在库里就是数字（弹层的 select 按数字用）。
  // `buckets` 是**值**（expose 出来的 ref 会被 Vue 解包）⇒ 不许再写 `.value`
  () =>
    (table.value?.buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
      SYSTEM_ENUM_TYPE.AUDIT_TYPE_ENUM
    ] ?? []) as NameValueEnumMetadata<number>[],
)

/** 展开行里那张审核表的 key：审核成功后 +1 ⇒ 重挂 ⇒ 重新取数（刷新那一行的列表） */
const memberTableKey = ref(0)

/** 新增 / 编辑弹层：`@add` / `@edit` 在模板上接管 pro 的默认跳转，弹层状态留在壳里 */
const form = ref<{open: boolean; entity: EnterpriseInvitationSavePayload}>({
  open: false,
  entity: createEmptyForm(),
})

function openForm(record?: EnterpriseInvitationEntity): void {
  form.value = {
    open: true,
    entity: record
      ? {
          ...record,
          expirationTime: record.expirationTime
            ? globalProperties.$dayjs(record.expirationTime)
            : undefined,
        }
      : createEmptyForm(),
  }
}
</script>

<template>
  <div>
    <l-crud-home-page
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
              {{ globalProperties.$t('authServer.enterpriseInvitation.invitedMembers') }}
            </a-space>
          </template>
        </crud-home-page>
      </template>
    </l-crud-home-page>

    <teleport v-if="form.open || invitationShare.open || enterpriseMemberAudit.open" to="body">
      <l-enterprise-invitation-modal
        v-if="form.open"
        v-model:open="form.open"
        v-model:entity="form.entity"
        :audit-type-options="auditTypeOptions"
        @success="table?.fetchDataSource()"
      />

      <!-- 审核弹层：与成员管理页共用一份（状态在成员声明里）。审核完把展开行里的表换个 key 重挂 ⇒ 重新取数 -->
      <l-enterprise-member-audit-modal
        v-if="enterpriseMemberAudit.open"
        @success="memberTableKey += 1"
      />

      <l-qr-code-modal
        v-if="invitationShare.open"
        v-model:open="invitationShare.open"
        :url="invitationShare.url"
      />
    </teleport>
  </div>
</template>
