<script setup lang="ts">

import {dateTimeFormat, getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import LCrudTable from "@/components/basic/CrudTable.vue";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {SearchableColumnType} from "@/types/composables";
import type {EnumBucketsResponseBody, RestResult} from "@/types/apis";
import {ResourceServerService} from "@/apis";
import {BatchMessageService} from "@/apis/message-server/batchMessageService.js";

defineOptions({
  name: 'MessageServerBatchHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new BatchMessageService();

const columns = ref<SearchableColumnType[]>([
  {
    title: globalProperties.$t('common.type'),
    dataIndex: "type",
    ellipsis: true,
    key: "type",
    width: 80
  },
  {
    title: globalProperties.$t('common.creationTime'),
    dataIndex: "creationTime",
    ellipsis: true,
    key: "creation_time",
    width: 210,
  },
  {
    title: globalProperties.$t('common.status'),
    dataIndex: "executeStatus",
    key: "execute_status",
    ellipsis: true,
    width: 80
  },
  {
    title: globalProperties.$t('messageServer.batch.count'),
    dataIndex: "count",
    key: "count",
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
    title: globalProperties.$t('messageServer.batch.failNumber'),
    dataIndex: "failNumber",
    key:"fail_number",
    ellipsis: true,
    width: 200
  },
  {
    title: globalProperties.$t('common.completionTime'),
    dataIndex: "completeTime",
    ellipsis: true,
    width: 210,
  }
])

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    "resource-server": [{"id": "ExecuteStatus"}, {"id": "CloudChannelEnum"}],
    "message-server": [{"id": "MessageTypeEnum"}]
  })
  if (enums.data) {
    const statusCol = columns.value.find((s) => s.dataIndex === 'executeStatus')
    if (statusCol?.search) {
      statusCol.search.props = statusCol.search.props ?? {}
      statusCol.search.props.options = enums.data['resource-server']?.ExecuteStatus
    }

    const typeCol = columns.value.find((s) => s.dataIndex === 'type')
    if (typeCol?.search) {
      typeCol.search.props = typeCol.search.props ?? {}
      typeCol.search.props.options = enums.data['message-server']?.MessageTypeEnum
    }
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
      export:'perms[message_server_batch:export]',
      detail:'perms[message_server_batch:get]',
      delete:'perms[message_server_batch:delete]'
    }"
      :scroll="{x:'max-content'}"
      :row-selection="{fixed: true, type: 'checkbox'}"
      @detail="r => globalProperties.$router.push({name:'message_server_batch_detail', query:{id:String(r.id)}})"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'creationTime'">
          {{ dateTimeFormat(record.creationTime) }}
        </template>
        <template v-if="column.dataIndex === 'completeTime'">
          {{ dateTimeFormat(record.successTime) }}
        </template>
        <template v-if="column.dataIndex === 'executeStatus'">
          <a-space>
            <template v-if="getEnumValue(record.executeStatus) === 99">
              <a-tooltip :title="record.exception">
                <icon-font class="icon align" type="icon-warning"/>
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
