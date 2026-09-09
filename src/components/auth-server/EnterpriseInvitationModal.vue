<script lang="ts">
import {AUDIT_TYPE_VALUE} from "@/constants"
import type {EnterpriseInvitationSavePayload} from "@/types/apis"

export function createEmptyForm(): EnterpriseInvitationSavePayload {
  return {
    id: null as unknown as number,
    expirationTime: null as unknown as number,
    auditType: AUDIT_TYPE_VALUE.AUTOMATIC,
    roleIds: [],
  }
}
</script>

<script setup lang="ts">

import {
  DATE_TIME_FORMAT,
  OPERATION_DATA_TRACE_TABLE
} from "@/constants";
import LModalForm from "@/components/basic/form/ModalForm.vue";
import LEnterpriseRoleTable from "@/components/auth-server/EnterpriseRoleTable.vue";
import type {
  NameValueEnumMetadata
} from "@/types/apis";
import {EnterpriseInvitationService} from "@/apis";
import type {TableProps} from "antdv-next";

defineOptions({
  name: 'LEnterpriseInvitationModal',
})

const props = defineProps<{
  auditTypeOptions:NameValueEnumMetadata<number>[],
}>()

const open = defineModel<boolean>("open", {default:false})
const entity = defineModel<EnterpriseInvitationSavePayload>("entity", {
  default:() => createEmptyForm()
})

const emits = defineEmits<{
  success:[]
}>()

const service = new EnterpriseInvitationService()

const roleSelectedChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _selectedRowKeys
) => {
  entity.value.roleIds = _selectedRowKeys as number[]
}

function onSuccess() {
  open.value = false
  emits("success")
}
</script>

<template>
  <l-modal-form
    ref="editForm"
    @cancel="entity = createEmptyForm()"
    @success="onSuccess"
    :title="$t('common.add', {name: ' ' + $t('authServer.enterpriseInvitation.routePage')})"
    v-model:open="open"
    :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE_INVITATION"
    :service="service"
    v-model:entity="entity"
  >
    <template #rowLayout>
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
        <a-form-item name="expirationTime" :label="$t('common.expiresTime')">
          <a-date-picker :value-format="DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT" show-time allow-clear class="w-full" v-model:value="entity.expirationTime"  />
        </a-form-item>
      </a-col>
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
        <a-form-item name="auditType" :label="$t('authServer.enterpriseInvitation.auditType')" >
          <a-select class="w-full" v-model:value="entity.auditType" :options="props.auditTypeOptions" :field-names="{label: 'name'}"/>
        </a-form-item>
      </a-col>
    </template>

    <a-form-item name="roleIds" :label="$t('authServer.userRole')" :rules="[{required: true, type:'array'}]">
      <l-enterprise-role-table preview hide-title :query="{'filter_[enabled_eq]':'1'}" :row-selection="{type: 'checkbox', selectedRowKeys: entity.roleIds, onChange: roleSelectedChange}"/>
    </a-form-item>

    <a-form-item name="subTitle" :label="$t('common.subTitle')">
      <a-textarea v-model:value="entity.subTitle" :rows="4" show-count :maxlength="256" />
    </a-form-item>

    <a-form-item name="remark" :label="$t('common.remark')">
      <a-textarea v-model:value="entity.remark" :rows="4" show-count :maxlength="256" />
    </a-form-item>

  </l-modal-form>
</template>
