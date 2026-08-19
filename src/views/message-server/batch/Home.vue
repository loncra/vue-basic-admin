<script setup lang="ts">

import {
  applyColumnOptions,
  dateTimeFormat,
  getEnumName,
  getEnumValue,
  requireNonNullOrUndefined
} from "@/utils";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted
} from "vue";
import type {SearchableColumnType} from "@/types/composables";
import type {EnumBucketsResponseBody, RestResult} from "@/types/apis";
import {ResourceServerService} from "@/apis";
import {BatchMessageService} from "@/apis/message-server/batchMessageService.js";
import {
  MESSAGE_SERVER_BATCH_AUTHORITY,
  MESSAGE_SERVER_BATCH_ROUTE,
  EXECUTE_STATUS_TYPE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from "@/constants";
import {DateRangePicker, Select} from "antdv-next";

defineOptions({
  name: 'MessageServerBatchHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new BatchMessageService();

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.type'),
    dataIndex: "type",
    ellipsis: true,
    key: "type",
    width: 80,
    search:{
      component: markRaw(Select),
      class:'w-full',
      props:{classes:{root:'w-full'}, fieldNames:{label:'name'}, placeholder: globalProperties.$t('search.placeholder.select')},
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('common.creationTime'),
    dataIndex: "creationTime",
    ellipsis: true,
    key: "creation_time",
    width: 210,
    search:{
      component: markRaw(DateRangePicker),
      props:{},
      expression:'between'
    },
  },
  {
    title: globalProperties.$t('common.status'),
    dataIndex: "executeStatus",
    key: "execute_status",
    ellipsis: true,
    width: 80,
    search:{
      component: markRaw(Select),
      props:{classes:{root:'w-full'}, fieldNames:{label:'name'}, placeholder: globalProperties.$t('search.placeholder.select')},
      expression:'eq'
    },
  },
  {
    title: globalProperties.$t('messageServer.batch.count'),
    dataIndex: "count",
    key: "count",
    ellipsis: true,
    width: 200
  },
  {
    title: globalProperties.$t('messageServer.batch.failNumber'),
    dataIndex: "failNumber",
    key:"fail_number",
    ellipsis: true,
    width: 200
  },
  {
    title: globalProperties.$t('messageServer.batch.successNumber'),
    dataIndex: "successNumber",
    key:"success_number",
    ellipsis: true,
    width: 200
  },
  {
    title: globalProperties.$t('common.completionTime'),
    dataIndex: "completeTime",
    ellipsis: true,
    width: 210,
    search:{
      component: markRaw(DateRangePicker),
      props:{},
      expression:'between'
    },
  }
])

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [{id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS}],
    [SYSTEM_MODULE_NAME.MESSAGE_SERVER]: [{id: SYSTEM_ENUM_TYPE.BATCH_MESSAGE_TYPE_ENUM}]
  })
  if (enums.data) {
    applyColumnOptions(columns.value, 'executeStatus', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.EXECUTE_STATUS] || [])
    applyColumnOptions(columns.value, 'type', enums.data[SYSTEM_MODULE_NAME.MESSAGE_SERVER]?.[SYSTEM_ENUM_TYPE.BATCH_MESSAGE_TYPE_ENUM] || [])
  }
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-crud-table
      v-bind="$attrs"
      :service="service"
      :columns="columns"
      :authority="{
      export:MESSAGE_SERVER_BATCH_AUTHORITY.EXPORT,
      detail:MESSAGE_SERVER_BATCH_AUTHORITY.GET,
      delete:MESSAGE_SERVER_BATCH_AUTHORITY.DELETE
    }"
      :scroll="{x:'max-content'}"
      :row-selection="{fixed: true, type: 'checkbox'}"
      @detail="r => globalProperties.$router.push({name:MESSAGE_SERVER_BATCH_ROUTE.DETAIL, query:{id:String(r.id)}})"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'creationTime'">
          {{ dateTimeFormat(record.creationTime) }}
        </template>
        <template v-if="column.dataIndex === 'completeTime'">
          {{ dateTimeFormat(record.completeTime) }}
        </template>
        <template v-if="column.dataIndex === 'executeStatus'">
          <a-space>
            <template v-if="getEnumValue(record.executeStatus) === EXECUTE_STATUS_TYPE.FAILURE">
              <a-tooltip :title="record.exception">
                <icon-font class="icon align" type="loncra-message-circle-warning"/>
              </a-tooltip>
            </template>
            {{ getEnumName(record.executeStatus) }}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'type'">
          {{ getEnumName(record.type) }}
        </template>
      </template>
    </l-crud-table>
  </div>
</template>
