<script setup lang="ts">

import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import {DatePicker, Input, InputNumber, Select} from 'antdv-next';
import {OperationDataTraceAuditEventService, ResourceServerService} from "@/apis";
import {dateTimeFormat, postTimestampFormat, requireNonNullOrUndefined} from "@/utils";
import type {AuditEventEntity, EnumBucketsResponseBody, FilterRequest, RestResult} from "@/types/apis";
import type {SearchableColumnType} from "@/types/composables";
import LCrudTable from "@/components/basic/CrudTable.vue";

defineOptions({
  name: 'LOperationDataTraceTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  query?: FilterRequest,
  detailView?: boolean,
  date?: number
}>(), {
  query: () => ({})
})

const service = new OperationDataTraceAuditEventService()
const resourceServerService = new ResourceServerService()

const columns = ref<SearchableColumnType[]>([
  {
    title: globalProperties.$t('authServer.auditEvent.type'),
    dataIndex: "auditType",
    ellipsis: true,
    width: 200,
    key:'data.operationDataTrace.controllerAuditType',
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('authServer.auditEvent.target'),
    dataIndex: "target",
    ellipsis: true,
    width: 150,
    key:'data.operationDataTrace.target',
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  },
  {
    title:  globalProperties.$t('operation.time'),
    dataIndex: "creationTime",
    ellipsis: true,
    width: 210,
    key:'after',
    search:{
      component: markRaw(DatePicker),
      props:{allowClear:false, placeholder: globalProperties.$t('search.placeholder.input'), showTime: true},
      queryName:'after'
    },
  },
  {
    title: globalProperties.$t('operation.principal'),
    dataIndex: "principal",
    ellipsis: true,
    width: 150,
    key:'principal',
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      queryName:'filter_[principal_eq]_or_[data.details.metadata.realName_eq]'
    },
  },
  {
    title: globalProperties.$t('operation.type'),
    dataIndex: "type",
    ellipsis: true,
    width: 100,
    key: 'data.operationDataTrace.type.value',
    search:{
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('authServer.auditEvent.traceId'),
    dataIndex: "traceId",
    ellipsis: true,
    width: 150,
    key:'data.operationDataTrace.entityId',
    search:{
      component: markRaw(InputNumber),
      props:{classes:{root:'w-full'}, placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('common.remark'),
    dataIndex: "remark",
    ellipsis: true,
    width: 400
  },
])

const dataSource = ref<AuditEventEntity[]>([])
const options = ref<{
  query:FilterRequest
}>({
  query: {}
})

options.value.query = {...props.query};
options.value.query.after = props.date;

if (props.date) {
  options.value.query.after = globalProperties.$dayjs(props.date)
} else {
  options.value.query.after = globalProperties.$dayjs().startOf('d')
}

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"OperationDataType"}]})
  if (enums.data) {
    const typeCol = columns.value[columns.value.findIndex(s => s.dataIndex === "type")];
    if (typeCol?.search) {
      typeCol.search.props = typeCol.search.props ?? {}
      typeCol.search.props.options = enums.data['resource-server']?.OperationDataType
    }
  }
  if (props.detailView) {
    columns.value = columns.value.filter(v => !["target", "auditType", "traceId"].includes(v.dataIndex as string))
  }
}

onMounted(mounted)

</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :query="options.query"
    v-model:data-source="dataSource"
    :enabled-actions="!props.detailView"
    :service="service"
    :columns="columns"
    :authority="{detail:'perms[auth_server_audit_event:get]'}"
    :scroll="{x:'max-content'}"
    @detail="r => globalProperties.$router.push({name:'auth_server_audit_event_operation_data_trace_detail', query:{id:String(r.id),after:postTimestampFormat(r.timestamp)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'creationTime'">
        {{ dateTimeFormat(record.timestamp) }}
      </template>
      <template v-if="column.dataIndex === 'target'">
        {{ record.data.operationDataTrace.target }}
      </template>
      <template v-if="column.dataIndex === 'auditType'">
        {{ record.data.operationDataTrace.controllerAuditType }}
      </template>
      <template v-if="column.dataIndex === 'traceId'">
        {{ record.data.operationDataTrace.entityId }}
      </template>
      <template v-if="column.dataIndex === 'remark'">
        {{ record.data.operationDataTrace.remark }}
      </template>
      <template v-if="column.dataIndex === 'principal'">
        {{ record.data?.details?.metadata?.realName || record.principal }}
      </template>
      <template v-if="column.dataIndex === 'type'">
        {{ record.data.operationDataTrace.type.name }}
      </template>
    </template>
  </l-crud-table>
</template>
