<template>
  <div>
    <card-curd-component
      :table-options="options.table"
      :search-options="options.search"
      :permission-options="options.permission"
      v-model:pagination="options.table.pagination"
      v-model:loading="options.loading"
      @search="search">

      <template #tableBodyCell="{ record, column }">
        <template v-if="column.dataIndex === 'creationTime'">
          {{ globalProperties.dateTimeFormat(record.timestamp) }}
        </template>

        <template v-if="column.dataIndex === 'principal'">
          {{ record.data?.details?.metadata?.realName || record.principal}}
        </template>
        <template v-if="column.key === 'action'">
          <div class="text-align-center">
            <a-space>
              <a-button size="small" @click="detail(record)" v-if="principalStore.hasPermission('perms[audit_event:get]')">
                <icon-font class="icon" type="icon-file"/>
                <span class="hidden-md hidden-sm hidden-xs">详情</span>
              </a-button>
            </a-space>
          </div>
        </template>
      </template>
      <template #searchFormBody>
        <a-form-item label="操作时间" name="date" :rules="[{required: true, trigger: 'change', type: 'object'}]">
          <a-date-picker class="width-percent-100" :allowClear="false" show-time v-model:value="options.search.form.after"/>
        </a-form-item>
        <a-form-item label="操作用户" name="principal">
          <a-input v-model:value="options.search.form.principal"/>
        </a-form-item>
      </template>
    </card-curd-component>
  </div>
</template>

<script setup>

import CardCurdComponent from '@/components/base/CardCurdComponent.vue'
import {getCurrentInstance, onMounted, ref} from 'vue'
import {searchAuditEventLoginPage} from '@/apis/authenticationApi.js'
import {usePrincipalStore} from '@/stores/principalStore.js'

const principalStore = usePrincipalStore();
const globalProperties = getCurrentInstance().appContext.config.globalProperties;

const options = ref({
  search:{
    form:{
      after: globalProperties.$dayjs().startOf('d'),
      principal: ""
    },
    value:'principal',
    placeholder:'请输入操作用户进行查询'
  },
  loading:false,
  table:{
    columns:[{
      title: "登录时间",
      dataIndex: "creationTime",
      ellipsis: true,
      width: 210
    }, {
      title: "登录用户",
      dataIndex: "principal",
      ellipsis: true,
      width: 150
    }, {
      title: "操作",
      align: "center",
      key: "action",
      fixed: "right",
      width: 110
    }],
    dataSource:[],
    pagination:{
      total:0,
      current:1,
      pageSize:10
    },
    rowSelection: false,
  },
  permission:{
    add:false,
    remove: false
  }
});

function search() {
  options.value.loading = true;

  let param = options.value.search.form;

  param.size = options.value.table.pagination.pageSize;
  param.number = options.value.table.pagination.current;

  searchAuditEventLoginPage(globalProperties.formUrlEncoded(param))
    .then(r => setTableDataSource(r.data.data))
    .then(() => options.value.loading = false)
    .catch(() => options.value.loading = false)
}

function setTableDataSource(data) {
  options.value.table.dataSource = data.elements;
  options.value.table.pagination.total = data.totalCount;
  options.value.table.pagination.current = data.number;
  options.value.table.pagination.pageSize = data.size;
}

function detail(record) {
  const to = {
    name:'authentication_login_detail',
    query:{
      id: record.id,
      after:globalProperties.postTimestampFormat(Math.round(record.timestamp))
    }
  }
  globalProperties.$router.push(to);
}

onMounted(() => search());

</script>
