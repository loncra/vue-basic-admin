<script setup lang="ts">
import LAuthorityOperateTable, {
  type SearchableColumnType
} from '@/components/baisc/AuthorityOperateTable.vue'
import {ConsoleUserService} from '@/apis/auth-server/consoleUserService.ts'
import {onMounted, ref} from 'vue'
import type {ConsoleUserEntity} from '@/types/auth-server/consoleUserType.ts'
import {DateRangePicker, InputNumber, InputSearch, Select} from 'antdv-next'
import {ResourceServerService} from "@/apis";
import type {RestResult} from "@/types";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";

defineOptions({
  name: 'LConsoleUserTableTable',
})

const consoleUserService = new ConsoleUserService()
const resourceServerService = new ResourceServerService()

const columns = ref<SearchableColumnType[]>([
  {
    title: '真实姓名',
    dataIndex: 'realName',
    key: 'real_name',
    search:{
      component: InputSearch,
      props:{},
      expression:'like'
    },
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    search:{
      component: Select,
      props:{},
      expression:'eq'
    },
  },
  {
    title: '登录账户',
    dataIndex: 'username',
    key: 'username',
    search:{
      component: InputSearch,
      props:{},
      expression:'like'
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    search: {
      component: Select,
      props: {},
      expression: 'eq',
    },
  },
  {
    title: '电子邮箱',
    dataIndex: 'email',
    key: 'email',
    search:{
      component: InputSearch,
      props:{

      },
      expression:'eq'
    },
  },
  {
    title: '手机号码',
    dataIndex: 'phoneNumber',
    key: 'phone_number',
    search:{
      component: InputNumber,
      props:{},
      expression:'eq'
    },
  },
  {
    title: '最后登录时间',
    dataIndex: 'lastAuthenticationTime',
    key: 'last_authentication_time',
    search:{
      component: DateRangePicker,
      props:{},
      expression:'betwent'
    },
  },
])
/** 与表格双向绑定，可直接参与计算属性、导出、批量操作等 */
const dataSource = ref<ConsoleUserEntity[]>([])

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"GenderEnum"}, {"id":"UserStatus"}]})
  if (enums.data) {
    const genderCol = columns.value[columns.value.findIndex(s => s.dataIndex === "gender")];
    if (genderCol && genderCol.search) {
      genderCol.search.props = {options : enums.data["resource-server"]?.GenderEnum, fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false}
    }

    const statusCol = columns.value.find(s => s.dataIndex === "status");
    if (statusCol && statusCol.search) {
      statusCol.search.props = {options : enums.data["resource-server"]?.UserStatus, fieldNames:{label:'name'}, classes:{root:'w-full'}}
    }
  }

}

onMounted(mounted)
</script>

<template>
  <div>
    <l-authority-operate-table
      v-model:data-source="dataSource"
      :service="consoleUserService"
      :columns="columns"
    />

  </div>
</template>
