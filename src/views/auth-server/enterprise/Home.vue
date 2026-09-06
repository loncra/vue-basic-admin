<script setup lang="ts">

import {EnterpriseService} from '@/apis/auth-server/enterpriseService.ts'
import {type ComponentInternalInstance, computed, getCurrentInstance, markRaw, onMounted} from 'vue'
import {DateRangePicker, Input, Select} from 'antdv-next'
import {ResourceServerService} from '@/apis'
import type {EnumBucketsResponseBody, RestResult} from '@/types/apis'
import {applyColumnOptions, dateTimeFormat, getEnumName, requireNonNullOrUndefined} from '@/utils'
import type {SearchableColumnType} from '@/types/composables'
import LCrudTable from '@/components/basic/crud/CrudTable.vue'
import LIconSelect from '@/components/basic/IconSelect.vue'
import {
  AUTH_SERVER_ENTERPRISE_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_ROUTE,
  ICON_SELECT_AVATAR_MODE_VALUE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

defineOptions({
  name: 'AuthServerEnterpriseHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new EnterpriseService()

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.name'),
    dataIndex: 'name',
    key: 'name',
    width: 240,
    ellipsis: true,
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'like',
    },
  },
  {
    title: globalProperties.$t('authServer.enterprise.ownerPrincipal'),
    dataIndex: 'ownerPrincipal',
    key: 'owner_principal',
    width: 200,
    ellipsis: true,
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'like',
    },
  },
  {
    title: globalProperties.$t('common.enabled'),
    dataIndex: 'enabled',
    key: 'enabled',
    width: 120,
    ellipsis: true,
    search: {
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames: {label: 'name'}, classes: {root: 'w-full'}, popupMatchSelectWidth: false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('authServer.enterprise.tenantId'),
    dataIndex: 'tenantId',
    key: 'tenant_id',
    width: 180,
    ellipsis: true,
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'like',
    },
  },
  {
    title: globalProperties.$t('common.remark'),
    dataIndex: 'remark',
    key: 'remark',
    width: 220,
    ellipsis: true,
  },
  {
    title: globalProperties.$t('authServer.enterprise.disbandTime'),
    dataIndex: 'disbandTime',
    key: 'disband_time',
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

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
      {id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    ],
  })
  if (enums.data) {
    applyColumnOptions(columns.value, 'enabled', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.YES_OR_NO] || [])
  }
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-crud-table
      :service="service"
      :columns="columns"
      :authority="{
        detail: AUTH_SERVER_ENTERPRISE_AUTHORITY.PAGE,
      }"
      :scroll="{x:'max-content'}"
      :row-selection="false"
      @detail="r => globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_ROUTE.DETAIL, query:{id:String(r.id)}})"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'name'">
          <a-space>
            <l-icon-select preview :value="record.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + record.name" />
            {{ record.name }}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'enabled'">
          {{ getEnumName(record.enabled) }}
        </template>
        <template v-if="column.dataIndex === 'disbandTime'">
          {{ dateTimeFormat(record.disbandTime) }}
        </template>
        <template v-if="column.dataIndex === 'creationTime'">
          {{ dateTimeFormat(record.creationTime) }}
        </template>
      </template>
    </l-crud-table>
  </div>
</template>
