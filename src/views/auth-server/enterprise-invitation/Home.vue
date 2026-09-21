<script setup lang="ts">
import {computed, type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import {AUTH_SERVER_AUDIT_STATUS_VALUE, AUTH_SERVER_AUDIT_TYPE_VALUE} from '@loncra/client/auth'
import type {EnterpriseInvitationEntity} from '@loncra/client/auth'
import {getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {QrCodeModal as LQrCodeModal} from '@loncra/antdv'
import {CrudHomePage as LCrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {EnterpriseInvitationSavePayload} from '@/types/apis'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@/constants'
import {renderIconFont, requireNonNullOrUndefined} from '@/utils'
import LEnterpriseInvitationModal, {
  createEmptyForm,
} from '@/components/auth-server/EnterpriseInvitationModal.vue'
import LEnterpriseMemberTable from '@/components/auth-server/EnterpriseMemberTable.vue'
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
        <l-enterprise-member-table
          audit
          :query="{
            'filter_[invitation_id_eq]': record.id,
            'filter_[audit_status_eq]': AUTH_SERVER_AUDIT_STATUS_VALUE.AUDITABLE,
          }"
        >
          <template #title>
            <a-space>
              <component :is="() => renderIconFont('loncra-user-check')" />
              {{ globalProperties.$t('authServer.enterpriseInvitation.invitedMembers') }}
            </a-space>
          </template>
        </l-enterprise-member-table>
      </template>
    </l-crud-home-page>

    <teleport v-if="form.open || invitationShare.open" to="body">
      <l-enterprise-invitation-modal
        v-if="form.open"
        v-model:open="form.open"
        v-model:entity="form.entity"
        :audit-type-options="auditTypeOptions"
        @success="table?.fetchDataSource()"
      />

      <l-qr-code-modal
        v-if="invitationShare.open"
        v-model:open="invitationShare.open"
        :url="invitationShare.url"
      />
    </teleport>
  </div>
</template>
