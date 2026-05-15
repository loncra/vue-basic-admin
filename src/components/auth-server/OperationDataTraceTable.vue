<script setup lang="ts">
import LAuthorityOperateTable, {
  type SearchableColumnType
} from '@/components/basic/AuthorityOperateTable.vue'
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import {DatePicker, Input, InputNumber, Select, type TableProps} from 'antdv-next';
import {OperationDataTraceAuditEventService, ResourceServerService} from "@/apis";
import {dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import type {FilterRequest, RestResult} from '@/types/common';
import type {AuditEventEntity} from "@/types/auth-server/auditEntityType.ts";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";

defineOptions({
  name: 'LOperationDataTraceTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  query?: FilterRequest,
  detailView?: boolean,
  date?: number,
  rowSelection?: TableProps["rowSelection"]
}>(), {

  filter: () => ({}),
  rowSelection: () => ({type: 'checkbox'})
})

const service = new OperationDataTraceAuditEventService()
const resourceServerService = new ResourceServerService()

const columns = ref<SearchableColumnType[]>([
  {
    title: "审计类型",
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
    title: "目标表",
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
    title: "操作时间",
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
    title: "操作用户",
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
    title: "操作类型",
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
    title: "关联业务 id",
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
    title: "操作说明",
    dataIndex: "remark",
    ellipsis: true,
    width: 400
  },
])

const dataSource = ref<AuditEventEntity[]>([])
const authorityOperateTable = ref();
const options = ref<{
  query:FilterRequest
}>({
  query: {}
})

options.value.query = {...props.query};

if (!options.value.query.after) {
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
    columns.value = columns.value.filter(v => v.dataIndex !== "target")
  }
}
onMounted(mounted)

</script>

<template>
  <div>
    <l-authority-operate-table
      v-bind="$attrs"
      ref="authorityOperateTable"
      :query="options.query"
      v-model:data-source="dataSource"
      :service="service"
      :columns="columns"
      :authority="{detail:'perms[auth_server_audit_event:get]'}"
      :scroll="{x:'max-content'}"
      :row-selection="props.rowSelection"
      @detail="r => globalProperties.$router.push({name:'auth_server_role_detail', query:{id:String(r.id)}})"
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
    </l-authority-operate-table>
  </div>
</template>
