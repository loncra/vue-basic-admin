<script setup lang="ts">
import LAuthorityOperateTable, {
  type SearchableColumnType
} from '@/components/basic/AuthorityOperateTable.vue'
import {ConsoleUserService} from '@/apis/auth-server/consoleUserService.ts'
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import type {ConsoleUserEntity} from '@/types/auth-server/consoleUserType.ts'
import {DateRangePicker, Input, InputNumber, Select} from 'antdv-next'
import {ResourceServerService} from "@/apis";
import type {RestResult} from "@/types";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";
import {dateTimeFormat, requireNonNullOrUndefined} from "@/utils";

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
const resourceServerService = new ResourceServerService()

const columns = ref<SearchableColumnType[]>([
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
      expression:'betwent'
    },
  },
])

const dataSource = ref<ConsoleUserEntity[]>([])
const authorityOperateTable = ref();

function removeSelected(selectedRows: ConsoleUserEntity[]) {
  authorityOperateTable.value.remove(selectedRows);
}

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"GenderEnum"}, {"id":"UserStatus"}]})
  if (enums.data) {
    const genderCol = columns.value[columns.value.findIndex(s => s.dataIndex === "gender")];
    if (genderCol?.search) {
      genderCol.search.props = genderCol.search.props ?? {}
      genderCol.search.props.options = enums.data['resource-server']?.GenderEnum
    }

    const statusCol = columns.value.find((s) => s.dataIndex === 'status')
    if (statusCol?.search) {
      statusCol.search.props = statusCol.search.props ?? {}
      statusCol.search.props.options = enums.data['resource-server']?.UserStatus
    }
  }

}
defineExpose({
  removeSelected
})

onMounted(mounted)
</script>

<template>
  <div>
    <l-authority-operate-table
      ref="authorityOperateTable"
      v-model:data-source="dataSource"
      :service="consoleUserService"
      :columns="columns"
      :enabled-actions="!props.preview"
      :authority="{edit:'perms[auth_server_console_user:save]',detail:'perms[auth_server_console_user:get]', delete:'perms[auth_server_console_user:delete]'}"
      :scroll="{x:'max-content'}"
      :row-selection="props.preview ? undefined : {type: 'checkbox'}"
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
    </l-authority-operate-table>
  </div>
</template>
