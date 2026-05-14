<script setup lang="ts">
import {AuthenticationAuditEventService} from '@/apis';
import LBasicCrudTable from '@/components/basic/BasicCrudTable.vue'
import {dateTimeFormat, requireNonNullOrUndefined} from '@/utils';
import {type ComponentInternalInstance, getCurrentInstance, markRaw, ref} from 'vue';
import type {SearchableColumnType} from '@/components/basic/AuthorityOperateTable.vue';
import {DatePicker, Input} from 'antdv-next';

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AuthenticationAuditEventService()

const columns = ref<SearchableColumnType[]>([
  {
    title: globalProperties.$t('authServer.lastAuthenticationTime'),
    dataIndex: "creationTime",
    key: "creationTime",
    ellipsis: true,
    width: 210,
    search:{
      component: markRaw(DatePicker),
      props:{placeholder: globalProperties.$t('search.placeholder.input'), showTime: true},
      queryName:'after',
      defaultValue: globalProperties.$dayjs().startOf('d')
    },
  }, {
    title: globalProperties.$t('auth.account'),
    dataIndex: "principal",
    key: "principal",
    ellipsis: true,
    width: 150,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      queryName:'principal'
    },
  }
])

</script>

<template>
  <l-basic-crud-table
    :service="service"
    :table="{
        columns: columns,
        authority: {
          detail:'perms[auth_server_audit_event:get]'
        }
    }"
  >
    <template #tableBodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'creationTime'">
          {{ dateTimeFormat(record.timestamp) }}
        </template>

        <template v-if="column.dataIndex === 'principal'">
          {{ record.data?.details?.metadata?.realName || record.principal}}
        </template>
    </template>
  </l-basic-crud-table>
</template>
