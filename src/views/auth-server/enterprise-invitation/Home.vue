<script setup lang="ts">

import {EnterpriseInvitationService} from '@/apis/auth-server/enterpriseInvitationService.ts'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted,
  ref
} from 'vue'
import {DateRangePicker, Select, type TableProps} from 'antdv-next'
import {AuthServerService, ResourceServerService} from '@/apis'
import type {
  EnterpriseInvitationEntity,
  EnterpriseInvitationSavePayload,
  EnterpriseRoleEntity,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  RestResult
} from '@/types/apis'
import {
  applyColumnOptions,
  createIcon,
  dateTimeFormat,
  getEnumName,
  requireNonNullOrUndefined
} from '@/utils'
import type {ActionDefinition, SearchableColumnType} from '@/types/composables'
import LCrudTable from '@/components/basic/crud/CrudTable.vue'
import {
  AUTH_SERVER_ENTERPRISE_INVITATION_AUDITS,
  AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE,
  DATE_TIME_FORMAT,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import LModalForm from "@/components/basic/form/ModalForm.vue";
import LEnterpriseRoleTable from "@/components/auth-server/EnterpriseRoleTable.vue";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import LQrCodeModal from "@/components/basic/QrCodeModal.vue";

defineOptions({
  name: 'AuthServerEnterpriseInvitationHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new EnterpriseInvitationService()

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('authServer.enterpriseInvitation.inviterPrincipal'),
    dataIndex: 'member',
    key: 'member',
    width: 250,
    ellipsis: true
  },
  {
    title: globalProperties.$t('common.status'),
    dataIndex: 'status',
    key: 'status',
    width: 120,
    ellipsis: true,
    search: {
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames: {label: 'name'}, classes: {root: 'w-full'}, popupMatchSelectWidth: false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('authServer.enterpriseInvitation.auditType'),
    dataIndex: 'auditType',
    key: 'audit_type',
    width: 120,
    ellipsis: true,
    search: {
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames: {label: 'name'}, classes: {root: 'w-full'}, popupMatchSelectWidth: false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('authServer.enterpriseInvitation.roleId'),
    dataIndex: 'roles',
    key: 'roles',
    width: 180,
    ellipsis: true,
  },
  {
    title: globalProperties.$t('common.expiresTime'),
    dataIndex: 'expirationTime',
    key: 'expiration_time',
    width: 210,
    search: {
      component: markRaw(DateRangePicker),
      props: {},
      expression: 'between',
    },
  },
  {
    title: globalProperties.$t('common.creationTime'),
    dataIndex: 'creationTime',
    key: 'creation_time',
    width: 210,
    search: {
      component: markRaw(DateRangePicker),
      props: {},
      expression: 'between',
    },
  },
])

const options = ref<{
  entity:EnterpriseInvitationSavePayload,
  auditTypeOptions:NameValueEnumMetadata<number>[]
  model:boolean
  shard:{
    open:boolean,
    url:string
  }
}>({
  model:false,
  shard:{
    open:false,
    url:''
  },
  entity:createEmptyForm(),
  auditTypeOptions:[]
})

const crudTable = ref()

function openShard(entity: EnterpriseInvitationEntity) {
  options.value.shard.open = true;
  options.value.shard.url = import.meta.env.VITE_APP_SITE_URL + import.meta.env.VITE_APP_ENTERPRISE_INVITATION_PATH + '/' + entity.id;
}

const itemActionDefinitions = function (): ActionDefinition<EnterpriseInvitationEntity>[] {
  return [
    {
      id: 'shard',
      permission:AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.GET,
      label: () => globalProperties.$t('common.shard'),
      icon: () => createIcon('loncra-shard'),
      run: (ctx) => openShard(ctx.record!),
    },
  ]
}

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.AUTH_SERVER]: [
      {id: SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_STATUS_ENUM},
      {id: SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_AUDIT_ENUM},
    ],
  })
  if (enums.data) {
    applyColumnOptions(
      columns.value,
      'status',
      enums.data[SYSTEM_MODULE_NAME.AUTH_SERVER]?.[SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_STATUS_ENUM] || [],
    )
    applyColumnOptions(
      columns.value,
      'auditType',
      enums.data[SYSTEM_MODULE_NAME.AUTH_SERVER]?.[SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_AUDIT_ENUM] || [],
    )
    options.value.auditTypeOptions = (enums.data[SYSTEM_MODULE_NAME.AUTH_SERVER]?.[SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_AUDIT_ENUM] || [] ) as NameValueEnumMetadata<number>[]
  }
}

function createEmptyForm():EnterpriseInvitationSavePayload {
  return {
    id:null as unknown as number,
    expirationTime: null as unknown as number,
    auditType:AUTH_SERVER_ENTERPRISE_INVITATION_AUDITS.AUTOMATIC,
    roleIds: []
  }
}

const roleSelectedChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _selectedRowKeys,
  selectedRows
) => {
  const rows = selectedRows as EnterpriseRoleEntity[]
  options.value.entity.roleIds = rows.flatMap((r) => (r.id != null ? [r.id] : []))
}

function onEdit(record:EnterpriseInvitationEntity | undefined) {
  options.value.model = true
  if (record) {
    options.value.entity.id = record.id
  }
}

function onSuccess() {
  options.value.model = false
  crudTable.value.fetchDataSource()
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-crud-table
      ref="crudTable"
      :service="service"
      :columns="columns"
      :row-actions="itemActionDefinitions()"
      :authority="{
        detail: AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.GET,
        delete: AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.DELETE,
        add:AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.SAVE,
      }"
      :scroll="{x:'max-content'}"
      :row-selection="{fixed: true, type: 'checkbox'}"
      @add="onEdit(undefined)"
      @edit="onEdit"
      @detail="r => globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE.DETAIL, query:{id:String(r.id)}})"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'member'">
          <a-space>
            <l-user-avatar :user="record.member" />
            {{AuthServerService.getPrincipalNameByUserDetails(record.member)}}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'status'">
          {{ getEnumName(record.status) }}
        </template>
        <template v-if="column.dataIndex === 'auditType'">
          {{ getEnumName(record.auditType) }}
        </template>
        <template v-if="column.dataIndex === 'roles'">
          {{ (record.roles || []).map(s => s.name).join(', ') }}
        </template>
        <template v-if="column.dataIndex === 'expirationTime'">
          {{ record.expirationTime ? dateTimeFormat(record.expirationTime) : globalProperties.$t('common.permanent')}}
        </template>
        <template v-if="column.dataIndex === 'creationTime'">
          {{ dateTimeFormat(record.creationTime) }}
        </template>
      </template>
    </l-crud-table>
  </div>

  <teleport v-if="options.model || options.shard.open" to="body">
    <l-modal-form
      ref="editForm"
      v-if="options.model"
      @cancel="options.entity = createEmptyForm()"
      @success="onSuccess"
      :title="globalProperties.$t('common.add', {name: ' ' + globalProperties.$t('authServer.enterpriseInvitation.routePage')})"
      v-model:open="options.model"
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE_INVITATION"
      :service="service"
      v-model:entity="options.entity"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="expirationTime" :label="globalProperties.$t('authServer.enterpriseInvitation.expirationTime')">
            <a-date-picker :value-format="DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT" show-time allow-clear class="w-full" v-model:value="options.entity.expirationTime"  />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="auditType" :label="globalProperties.$t('authServer.enterpriseInvitation.auditType')" >
            <a-select class="w-full" v-model:value="options.entity.auditType" :options="options.auditTypeOptions" :field-names="{label: 'name'}"/>
          </a-form-item>
        </a-col>
      </template>

      <a-form-item name="roleIds" :label="globalProperties.$t('authServer.userRole')" :rules="[{required: true, type:'array'}]">
        <l-enterprise-role-table preview hide-title :query="{'filter_[enabled_eq]':'1'}" :row-selection="{type: 'checkbox', selectedRowKeys: options.entity.roleIds, onChange: roleSelectedChange}"/>
      </a-form-item>

      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>

    </l-modal-form>

    <l-qr-code-modal
      v-if="options.shard.open"
      :url="options.shard.url"
      v-model:open="options.shard.open"
    />
  </teleport>
</template>
