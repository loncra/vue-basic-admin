<script setup lang="ts">

import {EnterpriseMemberService} from '@/apis/auth-server/enterpriseMemberService.ts'
import {type ComponentInternalInstance, computed, getCurrentInstance, markRaw, onMounted} from 'vue'
import {DateRangePicker, Input, Select, type TableProps} from 'antdv-next'
import {ResourceServerService} from "@/apis";
import type {
  EnterpriseMemberEntity,
  EnumBucketsResponseBody,
  RestResult,
  RoleEntity
} from "@/types/apis";
import {
  applyColumnOptions,
  dateTimeFormat,
  getEnumName,
  getEnumValue,
  requireNonNullOrUndefined
} from "@/utils";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY, AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME, YES_OR_NO_TYPE
} from "@/constants";

defineOptions({
  name: 'LEnterpriseMemberTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  preview?: boolean
}>(), {
  preview: false,
})

const service = new EnterpriseMemberService()

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.realName'),
    dataIndex: 'nickname',
    key: 'nickname',
    width: 150,
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
    title: globalProperties.$t('auth.account'),
    dataIndex: 'username',
    key: 'username',
    width: 180,
    ellipsis: true,
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'like',
    },
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
    title: globalProperties.$t('authServer.enterpriseMember.invitation'),
    dataIndex: 'invitation',
    key: 'invitation',
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
  },
])

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
    id:'detail'
  }
]


onMounted(mounted)
</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :service="service"
    :columns="columns"
    :row-actions="rowActions"
    :record-actions="!props.preview"
    :authority="{
      detail: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.GET,
      delete: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.DELETE
    }"
    :scroll="{x:'max-content'}"
    :row-selection="props.preview ? false : rowSelection"
    @detail="r => globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.DETAIL, query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'nickname'">
        {{ record.nickname || '' }}
      </template>
      <template v-if="column.dataIndex === 'gender'">
        {{ getEnumName(record.gender) }}
      </template>
      <template v-if="column.dataIndex === 'role'">
        {{ getEnumName(record.role) }}
      </template>
      <template v-if="column.dataIndex === 'invitation'">
        {{ getEnumName(record.invitation) }}
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
</template>
