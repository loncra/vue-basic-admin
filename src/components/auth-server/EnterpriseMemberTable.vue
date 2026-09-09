<script setup lang="ts">

import {EnterpriseMemberService} from '@/apis/auth-server/enterpriseMemberService.ts'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted,
  ref
} from 'vue'
import {DateRangePicker, Select, type TableProps} from 'antdv-next'
import {AuthServerService, ResourceServerService} from "@/apis";
import type {
  EnterpriseMemberEntity,
  EnumBucketsResponseBody,
  FilterRequest,
  RestResult
} from "@/types/apis";
import {
  applyColumnOptions,
  createIcon,
  dateTimeFormat,
  getEnumName,
  getEnumValue,
  requireNonNullOrUndefined
} from "@/utils";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import {
  AUDIT_STATUS_TYPE,
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from "@/constants";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import LForm from "@/components/Form.vue";
import {isBusinessSuccess} from "@/requests";
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'LEnterpriseMemberTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {message} = useApp()

const props = withDefaults(defineProps<{
  preview?: boolean
  audit?:boolean
  query?:FilterRequest,
}>(), {
  preview: false,
  audit:false
})

const service = new EnterpriseMemberService()

const columns = computed<SearchableColumnType[]>(() => {
  const result = [
    {
      title: globalProperties.$t('common.realName'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: globalProperties.$t('common.gender'),
      dataIndex: 'gender',
      key: 'gender',
      width: 120,
      ellipsis: true,
    },
    {
      title: globalProperties.$t('authServer.enterpriseMember.role'),
      dataIndex: 'role',
      key: 'role',
      width: 120,
      ellipsis: true,
      search: {
        component: markRaw(Select),
        props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames: {label: 'name'}, classes: {root: 'w-full'}, popupMatchSelectWidth: false},
        expression: 'eq',
      },
    },
    {
      title: globalProperties.$t('common.auditStatus'),
      dataIndex: 'auditStatus',
      key: 'audit_status',
      width: 120,
      ellipsis: true,
      search: {
        component: markRaw(Select),
        props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames: {label: 'name'}, classes: {root: 'w-full'}, popupMatchSelectWidth: false},
        expression: 'eq',
      },
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
      title: globalProperties.$t('common.phoneNumber'),
      dataIndex: 'phoneNumber',
      key: 'phone_number',
      width: 150,
      ellipsis: true,
    },
    {
      title: globalProperties.$t('authServer.lastAuthenticationTime'),
      dataIndex: 'lastAuthenticationTime',
      key: 'last_authentication_time',
      width: 210,
      search: {
        component: markRaw(DateRangePicker),
        props: {},
        expression: 'between',
      },
    }
  ]
  if (props.audit) {
    return result.filter(s => s.key !== 'last_authentication_time')
  }
  return result
})

const auditModal = ref<{
  selectedItems:EnterpriseMemberEntity[],
  open:boolean
  loading:boolean
  remark:string
}>({
  selectedItems:[],
  open:false,
  loading:false,
  remark:''
})

const crudTable = ref()

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
      {id: SYSTEM_ENUM_TYPE.GENDER_ENUM},
      {id: SYSTEM_ENUM_TYPE.USER_STATUS},
    ],
    [SYSTEM_MODULE_NAME.AUTH_SERVER]: [
      {id: SYSTEM_ENUM_TYPE.ENTERPRISE_MEMBER_ROLE_ENUM},
      {id: SYSTEM_ENUM_TYPE.ENTERPRISE_MEMBER_INVITATION_ENUM},
    ],
  })
  if (enums.data) {
    applyColumnOptions(columns.value, 'gender', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.GENDER_ENUM] || [])
    applyColumnOptions(columns.value, 'status', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.USER_STATUS] || [])
    applyColumnOptions(columns.value, 'role', enums.data[SYSTEM_MODULE_NAME.AUTH_SERVER]?.[SYSTEM_ENUM_TYPE.ENTERPRISE_MEMBER_ROLE_ENUM] || [])
    applyColumnOptions(columns.value, 'invitation', enums.data[SYSTEM_MODULE_NAME.AUTH_SERVER]?.[SYSTEM_ENUM_TYPE.ENTERPRISE_MEMBER_INVITATION_ENUM] || [])
  }

}

const getCheckboxProps: NonNullable<TableProps['rowSelection']>['getCheckboxProps'] = (record) => ({
  disabled: getEnumValue(record.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
})

const rowSelection: NonNullable<TableProps['rowSelection']> = {
  fixed: true,
  type: 'checkbox',
  getCheckboxProps,
}

const rowActions: ActionDefinition<EnterpriseMemberEntity>[] = [
  {
    id: 'edit',
    visible: (ctx) => getEnumValue(ctx.record?.role) !== AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
  },
  {
    id: 'delete',
    visible: (ctx) => getEnumValue(ctx.record?.role) !== AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
  },
  {
    id: 'audit',
    permission: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.AUDIT,
    enabled: (ctx) => getEnumValue(ctx.record!.auditStatus ?? 0) === AUDIT_STATUS_TYPE.AUDITABLE,
    label: () => globalProperties.$t('common.audit.text'),
    icon: () => createIcon('loncra-vote'),
    run: (ctx) => auditItems([ctx.record!]),
  },
]

function getAuditSelectedEntities(selectedItems: EnterpriseMemberEntity[]) {
    return selectedItems
      .filter(item => getEnumValue(item.auditStatus) === AUDIT_STATUS_TYPE.AUDITABLE)
}

function auditItems(items: EnterpriseMemberEntity[]) {
  auditModal.value.selectedItems = items;
  auditModal.value.open = true
}

function closeAuditModal() {
  auditModal.value.selectedItems = [];
  auditModal.value.open = false
}

function bulkActions(): ActionDefinition<EnterpriseMemberEntity>[] {
  return [
    {
      id: 'auditSelected',
      enabled: (ctx) => getAuditSelectedEntities(ctx.selectedItems).length > 0,
      permission: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.AUDIT,
      label:(ctx) => globalProperties.$t('common.audit.selected', {
        count: getAuditSelectedEntities(ctx.selectedItems).length,
      }),
      icon: () => createIcon('loncra-vote'),
      run: (ctx) => auditItems(getAuditSelectedEntities(ctx.selectedItems)),
    },
  ]
}

async function onAudit(status:number) {
  auditModal.value.loading = true
  try {
    const ids = auditModal.value.selectedItems.map(r => Number(r.id))
    const result:RestResult<void> = await service.audit(ids, {
      status: status,
      remark: auditModal.value.remark,
    })
    if (isBusinessSuccess(result)) {
      message.success(result.message)
      closeAuditModal()
      crudTable.value?.fetchDataSource()
    }
  } finally {
    auditModal.value.loading = false
  }
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-crud-table
      ref="crudTable"
      v-bind="$attrs"
      :service="service"
      :columns="columns"
      :query="props.query"
      :actions="bulkActions()"
      :row-actions="rowActions"
      :record-actions="!props.preview"
      :authority="{
        detail: props.audit ? '' : AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.GET,
        delete: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.DELETE
      }"
      :scroll="{x:'max-content'}"
      :row-selection="props.preview ? false : rowSelection"
      @detail="r => globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.DETAIL, query:{id:String(r.id)}})"
    >
      <template #title v-if="$slots.title">
        <slot name="title"/>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'name'">
          <a-space>
            <l-user-avatar :user="record" />
            {{AuthServerService.getPrincipalNameByUserDetails(record)}}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'gender'">
          {{ getEnumName(record.gender) }}
        </template>
        <template v-if="column.dataIndex === 'role'">
          {{ getEnumName(record.role) }}{{(record.roles || []).length > 0 ? ', ' + (record.roles || []).map(r => r.name).join(',') : ''}}
        </template>
        <template v-if="column.dataIndex === 'auditStatus'">
          {{ getEnumName(record.auditStatus) }}
        </template>
        <template v-if="column.dataIndex === 'status'">
          {{ getEnumName(record.status) }}
        </template>
        <template v-if="column.dataIndex === 'phoneNumber'">
          {{ record.phoneNumber || '' }}
        </template>
        <template v-if="column.dataIndex === 'lastAuthenticationTime'">
          {{ dateTimeFormat(record.lastAuthenticationTime) }}
        </template>
      </template>
    </l-crud-table>
    <teleport to="body">
      <a-modal @cancel="closeAuditModal" :open="auditModal.open" :footer="null" :title="globalProperties.$t('common.audit.title')" >

          <a-flex vertical gap="middle" >
            <a-flex align="center" gap="small" class="p-sm rounded-lg border border-border-secondary" :key="item.id" v-for="item of auditModal.selectedItems">
              <l-user-avatar size="large" :user="item" />
              <a-flex
                vertical
              >
                <a-typography-text>
                  {{AuthServerService.getPrincipalNameByUserDetails(item)}}
                </a-typography-text>
                <a-typography-text>
                  {{ getEnumName(item.role) }} {{(item.roles || []).length > 0 ? ',' + (item.roles || []).map(r => r.name).join(',') : ''}}
                </a-typography-text>
              </a-flex>
            </a-flex>
            <l-form id="form" ref="formRef" :model="auditModal">
              <a-form-item :label="globalProperties.$t('common.remark')" name="remark">
                <a-textarea v-model:value="auditModal.remark" :auto-size="{ minRows: 5, maxRows: 10 }"/>
              </a-form-item>
              <a-flex align="center" justify="flex-end" gap="middle">
                <a-button type="primary" :loading="auditModal.loading" @click="onAudit(AUDIT_STATUS_TYPE.AGREED)">
                  <template #icon>
                    <icon-font type="loncra-clipboard-check"/>
                  </template>
                  {{ globalProperties.$t('common.audit.agree') }}
                </a-button>
                <a-button type="primary" danger :loading="auditModal.loading" @click="onAudit(AUDIT_STATUS_TYPE.DISAGREE)">
                  <template #icon>
                    <icon-font type="loncra-clipboard-x"/>
                  </template>
                  {{ globalProperties.$t('common.audit.reject') }}
                </a-button>
              </a-flex>
            </l-form>
          </a-flex>
      </a-modal>
    </teleport>
  </div>
</template>
