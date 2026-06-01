<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue';
import {
  createIcon,
  dateTimeFormat,
  getEnumName,
  getEnumValue,
  requireNonNullOrUndefined
} from '@/utils'
import type {ActionDefinition, SearchableColumnType} from '@/types/composables';
import {mergeDefinitions} from "@/composables/basic/action";
import LCrudTable from "@/components/basic/CrudTable.vue";
import {DateRangePicker, Input, Select} from "antdv-next";
import {ResourceServerService} from "@/apis";
import type {EnumBucketsResponseBody, FilterRequest, RestResult} from "@/types/apis";
import {EmailMessageService} from "@/apis/message-server/emailMessageService.ts";
import type {EmailMessageEntity} from "@/types/apis/message-server/emailDomain.ts";

defineOptions({
  name: 'LEmailTable',
})

const props = withDefaults(defineProps<{
  preview?: boolean
  query?:FilterRequest,
}>(), {
  preview: false
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const actionButtons = ref<ActionDefinition<EmailMessageEntity>[]>([{
  id: "send",
  permission:'perms[message_server_email:send]',
  label:() => globalProperties.$t('common.send',{name:globalProperties.$t('messageServer.email.routePage')}),
  icon:() => createIcon('icon-send-fill'),
  run:() => void globalProperties.$router.push({name:'message_server_email_send'})
}])

const service = new EmailMessageService();

const columns = ref<SearchableColumnType[]>([
  {
    title: globalProperties.$t('common.creationTime'),
    dataIndex: "creationTime",
    key:'creation_time',
    ellipsis: true,
    width: 210,
    search:{
      component: markRaw(DateRangePicker),
      props:{},
      expression:'between'
    },
  },{
    title: globalProperties.$t('common.status'),
    dataIndex: "executeStatus",
    ellipsis: true,
    width: 100,
    key:'execute_status',
    search:{
      component: markRaw(Select),
      props: {mode:'multiple', maxTagCount: 2, placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },{
    title: globalProperties.$t('common.type'),
    dataIndex: "type",
    ellipsis: true,
    key:'type',
    width: 100,
    search:{
      component: markRaw(Select),
      props: {mode:'multiple', maxTagCount: 2, placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  }, {
    title: globalProperties.$t('common.title'),
    dataIndex: "title",
    key:'title',
    ellipsis: true,
    width: 550,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },{
    title: globalProperties.$t('common.email'),
    dataIndex: "toEmail",
    ellipsis: true,
    key:'to_email',
    width: 150,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  }, {
    title: globalProperties.$t('common.successTime'),
    dataIndex: "successTime",
    key:'success_time',
    ellipsis: true,
    width: 210
  }, {
    title: globalProperties.$t('common.retry.count'),
    dataIndex: "retryCount",
    key:'retry_count',
    ellipsis: true,
    width: 80
  }, {
    title: globalProperties.$t('common.retry.time'),
    dataIndex: "retryTime",
    key:'retry_time',
    ellipsis: true,
    width: 210
  }
])

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({"resource-server":[{"id":"ExecuteStatus"},{"id":"CloudChannelEnum"}],"message-server":[{"id":"MessageTypeEnum"}]})
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
    const channelCol = columns.value.find((s) => s.dataIndex === 'channel')
    if (channelCol?.search) {
      channelCol.search.props = channelCol.search.props ?? {}
      channelCol.search.props.options = enums.data['resource-server']?.CloudChannelEnum
    }
  }
}

onMounted(mounted)
</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :service="service"
    :columns="columns"
    :actions="mergeDefinitions(actionButtons)"
    :record-actions="!props.preview"
    :query="props.query"
    :hide-title="props.preview"
    :authority="{
      export:'perms[message_server_email:export]',
      detail:'perms[message_server_email:get]',
      delete:'perms[message_server_email:delete]'
    }"
    :scroll="{x:'max-content'}"
    :row-selection="{fixed: true, type: 'checkbox'}"
    @detail="r => globalProperties.$router.push({name:'message_server_email_detail', query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'channel'">
        {{ getEnumName(record.channel) }}
      </template>
      <template v-if="column.dataIndex === 'creationTime'">
        {{ dateTimeFormat(record.creationTime) }}
      </template>
      <template v-if="column.dataIndex === 'successTime'">
        {{ dateTimeFormat(record.successTime) }}
      </template>
      <template v-if="column.dataIndex === 'retryCount'">
        {{ record.retryCount  }} / {{ record.maxRetryCount }}
      </template>
      <template v-if="column.dataIndex === 'retryTime'">
        {{ dateTimeFormat(record.retryTime) }}
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
</template>
