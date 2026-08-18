<script setup lang="ts">

import {ConsoleUserService} from '@/apis/auth-server/consoleUserService.ts'
import {type ComponentInternalInstance, computed, getCurrentInstance, markRaw, onMounted} from 'vue'
import {DateRangePicker, Input, InputNumber, Select} from 'antdv-next'
import {ResourceServerService} from "@/apis";
import type {EnumBucketsResponseBody, RestResult} from "@/types/apis";
import {applyColumnOptions, dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import type {SearchableColumnType} from "@/types/composables";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import {CONSOLE_USER_AUTHORITY, SYSTEM_MODULE_NAME} from "@/constants";

defineOptions({
  name: 'LConsoleUserTableTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  preview?: boolean
}>(), {
  preview: false,
})

const consoleUserService = new ConsoleUserService()

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.realName'),
    dataIndex: 'realName',
    key: 'real_name',
    width: 150,
    ellipsis:true,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('common.gender'),
    dataIndex: 'gender',
    key: 'gender',
    width: 150,
    ellipsis:true,
    search:{
      component: markRaw(Select),
      props:{placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false, },
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('auth.account'),
    dataIndex: 'username',
    width: 300,
    ellipsis:true,
    key: 'username',
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('common.status'),
    dataIndex: 'status',
    key: 'status',
    width: 150,
    ellipsis:true,
    search: {
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('common.email'),
    dataIndex: 'email',
    key: 'email',
    width: 150,
    ellipsis:true,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('common.phoneNumber'),
    dataIndex: 'phoneNumber',
    key: 'phone_number',
    width: 150,
    ellipsis:true,
    search:{
      component: markRaw(InputNumber),
      props:{ classes:{root:'w-full'}, placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('authServer.lastAuthenticationTime'),
    dataIndex: 'lastAuthenticationTime',
    key: 'last_authentication_time',
    width: 210,
    search:{
      component: markRaw(DateRangePicker),
      props:{},
      expression:'between'
    },
  },
])

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]:[
      {"id":"GenderEnum"},
      {"id":"UserStatus"}
    ]
  })
  if (enums.data) {
    applyColumnOptions(columns.value, "gender", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.GenderEnum || [])
    applyColumnOptions(columns.value, "status", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.UserStatus || [])
  }
}

onMounted(mounted)
</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :service="consoleUserService"
    :columns="columns"
    :record-actions="!props.preview"
    :authority="{
      add:CONSOLE_USER_AUTHORITY.SAVE,
      export:CONSOLE_USER_AUTHORITY.EXPORT,
      edit:CONSOLE_USER_AUTHORITY.SAVE,
      detail:CONSOLE_USER_AUTHORITY.GET,
      delete:CONSOLE_USER_AUTHORITY.DELETE
    }"
    :scroll="{x:'max-content'}"
    :row-selection="props.preview ? false : {fixed: true, type: 'checkbox'}"
    @add="globalProperties.$router.push({name:'auth_server_console_user_add'})"
    @detail="r => globalProperties.$router.push({name:'auth_server_console_user_detail', query:{id:String(r.id)}})"
    @edit="r => globalProperties.$router.push({name:'auth_server_console_user_edit', query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'gender'">
        {{ record.gender.name }}
      </template>
      <template v-if="column.dataIndex === 'lastAuthenticationTime'">
        {{ dateTimeFormat(record.lastAuthenticationTime) }}
      </template>
      <template v-if="column.dataIndex === 'status'">
        {{ record.status.name }}
      </template>
    </template>
  </l-crud-table>
</template>
