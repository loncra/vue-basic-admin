<script setup lang="ts">
import LAuthorityOperateTable, {
  type SearchableColumnType
} from '@/components/basic/AuthorityOperateTable.vue'
import {ConsoleUserService} from '@/apis/auth-server/consoleUserService.ts'
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import type {ConsoleUserEntity} from '@/types/auth-server/consoleUserType.ts'
import {DateRangePicker, InputNumber, InputSearch, Select} from 'antdv-next'
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
    title: '真实姓名',
    dataIndex: 'realName',
    key: 'real_name',
    width: 150,
    search:{
      component: markRaw(InputSearch),
      props:{},
      expression:'like'
    },
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    width: 150,
    search:{
      component: markRaw(Select),
      props:{fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression:'eq'
    },
  },
  {
    title: '登录账户',
    dataIndex: 'username',
    width: 300,
    key: 'username',
    search:{
      component: markRaw(InputSearch),
      props:{},
      expression:'like'
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 150,
    search: {
      component: markRaw(Select),
      props: {fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
  {
    title: '电子邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 150,
    search:{
      component: markRaw(InputSearch),
      props:{

      },
      expression:'eq'
    },
  },
  {
    title: '手机号码',
    dataIndex: 'phoneNumber',
    key: 'phone_number',
    width: 150,
    search:{
      component: markRaw(InputNumber),
      props:{ classes:{root:'w-full'}},
      expression:'eq'
    },
  },
  {
    title: '最后登录时间',
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
/** 与表格双向绑定，可直接参与计算属性、导出、批量操作等 */
const dataSource = ref<ConsoleUserEntity[]>([])
const selectedRows = ref<ConsoleUserEntity[]>([])
const authorityOperateTable = ref();

function removeSelected() {
  authorityOperateTable.value.remove(selectedRows.value);
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
      v-model:selected-rows="selectedRows"
      :service="consoleUserService"
      :columns="columns"
      :enabled-actions="!props.preview"
      :authority="{save:'perms[auth_server_console_user:save]',detail:'perms[auth_server_console_user:get]', delete:'perms[auth_server_console_user:delete]', view:'perms[auth_server_console_user:page]'}"
      :scroll="{x:columns.reduce((sum: number, c: SearchableColumnType) => sum + ((c.width || 0) as number), 0)}"
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
