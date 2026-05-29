<script setup lang="ts">
import {AuthenticationAuditEventService} from '@/apis';
import {dateTimeFormat, postTimestampFormat, requireNonNullOrUndefined} from '@/utils';
import {type ComponentInternalInstance, getCurrentInstance, markRaw, ref} from 'vue';
import {DatePicker, Input} from 'antdv-next';
import type {AuditEventEntity} from '@/types/apis/auth-server/auditDomain';
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {SearchableColumnType} from "@/types/composables";

defineOptions({
  name: 'AuthServerAuthenticationEventHome'
})

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
      props:{allowClear:false, class:'w-full', placeholder: globalProperties.$t('search.placeholder.input'), showTime: true},
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
      queryName:'filter_[principal_eq]_or_[data.details.metadata.realName_eq]'
    },
  }, {
    title: globalProperties.$t('authServer.deviceIdentified'),
    dataIndex: "deviceIdentified",
    key: "deviceIdentified",
    ellipsis: true,
    width: 300
  }, {
    title: globalProperties.$t('common.ip'),
    dataIndex: "ip",
    key: "ip",
    ellipsis: true,
    width: 250,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      queryName:'filter_[data.details.requestDetails.remoteAddress_eq]'
    },
  }, {
    title: globalProperties.$t('common.type'),
    dataIndex: "type",
    key: "type",
    ellipsis: true,
    width: 150,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  }, {
    title: globalProperties.$t('common.system'),
    dataIndex: "system",
    key: "system",
    ellipsis: true,
    width: 150
  }
])

function openAuthenticationDetail(r: AuditEventEntity) {
  globalProperties.$router.push({
    name: 'auth_server_audit_event_authentication_detail',
    query:{id:String(r.id),after:postTimestampFormat(r.timestamp)}
  })
}

</script>

<template>
  <l-crud-table
    :service="service"
    :columns="columns"
    :authority="{
      detail: 'perms[auth_server_audit_event:get]',
    }"
    :scroll="{x:'max-content'}"
    @detail="openAuthenticationDetail"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'creationTime'">
        {{ dateTimeFormat(record.timestamp) }}
      </template>

      <template v-if="column.dataIndex === 'principal'">
        {{ record.data?.details?.metadata?.realName || record.principal}}
      </template>
      <template v-if="column.dataIndex === 'deviceIdentified'">
        {{ record.data?.details?.requestDetails?.requestHeaders?.['x-device-identified'] }}
      </template>
      <template v-if="column.dataIndex === 'ip'">
        {{ record.data?.details?.requestDetails?.remoteAddress }}
      </template>
      <template v-if="column.dataIndex === 'type'">
        {{ record.data?.details?.requestDetails?.type }}
      </template>
      <template v-if="column.dataIndex === 'system'">
        {{ record.data?.details?.requestDetails?.requestHeaders?.['user-agent']}}
      </template>
    </template>
  </l-crud-table>

</template>
