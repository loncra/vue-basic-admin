<script setup lang="ts">

import {ConsoleUserService} from '@/apis/auth-server/consoleUserService.ts'
import {type ComponentInternalInstance, computed, getCurrentInstance, markRaw, onMounted} from 'vue'
import {DateRangePicker, Input, InputNumber, Select} from 'antdv-next'
import {AuthServerService, ResourceServerService} from "@/apis";
import type {ConsoleUserEntity, EnumBucketsResponseBody, RestResult} from "@/types/apis";
import {
  applyColumnOptions,
  createIcon,
  dateTimeFormat,
  getEnumName,
  requireNonNullOrUndefined
} from "@/utils";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import {
  AUTH_SERVER_CONSOLE_USER_AUTHORITY,
  AUTH_SERVER_CONSOLE_USER_ROUTE,
  AUTH_SERVER_SYSTEM_USER_AUTHORITY,
  AUTHENTICATION_TYPE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from "@/constants";
import {isBusinessSuccess} from "@/requests";
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'LConsoleUserTableTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {message, modal} = useApp()

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
      {id: SYSTEM_ENUM_TYPE.GENDER_ENUM},
      {id: SYSTEM_ENUM_TYPE.USER_STATUS_ENUM}
    ]
  })
  if (enums.data) {
    applyColumnOptions(columns.value, "gender", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.GENDER_ENUM] || [])
    applyColumnOptions(columns.value, "status", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.USER_STATUS_ENUM] || [])
  }
}

function rowActions(): ActionDefinition<ConsoleUserEntity>[] {
  return [
    {
      id: 'resetPassword',
      danger: true,
      permission: AUTH_SERVER_SYSTEM_USER_AUTHORITY.ADMIN_RESET_PASSWORD,
      label: () => globalProperties.$t('auth.adminResetPassword.text'),
      icon: () => createIcon('loncra-lock-open'),
      run: (ctx) => {
        if (ctx.record?.id == null) {
          return
        }
        modal.confirm({
          title: globalProperties.$t('auth.adminResetPassword.confirmTitle'),
          content: globalProperties.$t('auth.adminResetPassword.confirmSingle'),
          onOk: async () => {
            const result = await AuthServerService.adminResetPassword(
              AUTHENTICATION_TYPE.CONSOLE,
              String(ctx.record!.id),
            )
            if (isBusinessSuccess(result)) {
              message.success({
                content: globalProperties.$t('auth.adminResetPassword.success', {
                  password: String(result.data ?? ''),
                }),
                duration: 8,
              })
            }
          },
        })
      },
    },
  ]
}

onMounted(mounted)
</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :service="consoleUserService"
    :columns="columns"
    :row-actions="rowActions()"
    :record-actions="!props.preview"
    :authority="{
      add:AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      export:AUTH_SERVER_CONSOLE_USER_AUTHORITY.EXPORT,
      edit:AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      detail:AUTH_SERVER_CONSOLE_USER_AUTHORITY.GET,
      delete:AUTH_SERVER_CONSOLE_USER_AUTHORITY.DELETE
    }"
    :scroll="{x:'max-content'}"
    :row-selection="props.preview ? false : {fixed: true, type: 'checkbox'}"
    @add="globalProperties.$router.push({name:AUTH_SERVER_CONSOLE_USER_ROUTE.ADD})"
    @detail="r => globalProperties.$router.push({name:AUTH_SERVER_CONSOLE_USER_ROUTE.DETAIL, query:{id:String(r.id)}})"
    @edit="r => globalProperties.$router.push({name:AUTH_SERVER_CONSOLE_USER_ROUTE.EDIT, query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'gender'">
        {{ getEnumName(record.gender) }}
      </template>
      <template v-if="column.dataIndex === 'lastAuthenticationTime'">
        {{ dateTimeFormat(record.lastAuthenticationTime) }}
      </template>
      <template v-if="column.dataIndex === 'status'">
        {{ getEnumName(record.status) }}
      </template>
    </template>
  </l-crud-table>
</template>
