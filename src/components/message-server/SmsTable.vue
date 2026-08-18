<script setup lang="ts">
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted,
  ref
} from 'vue';
import {
  applyColumnOptions,
  createIcon,
  dateTimeFormat,
  getEnumName,
  getEnumValue,
  requireNonNullOrUndefined
} from '@/utils'
import type {ActionDefinition, SearchableColumnType} from '@/types/composables';
import type {
  EnumBucketsResponseBody,
  FilterRequest,
  RestResult,
  SmsMessageEntity
} from "@/types/apis";
import {SmsMessageService} from "@/apis/message-server";
import {mergeDefinitions} from "@/composables/basic/action";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import {DateRangePicker, Input, Select} from "antdv-next";
import {ResourceServerService} from "@/apis";
import {
  MESSAGE_SERVER_SMS_AUTHORITY,
  MESSAGE_SERVER_SMS_ROUTE,
  MESSAGE_SERVER_SMS_SIGN_AUTHORITY,
  MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY,
  SYSTEM_MODULE_NAME
} from "@/constants";

defineOptions({
  name: 'LSmsTable',
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

const actionButtons = ref<ActionDefinition<SmsMessageEntity>[]>([{
  id: "send",
  permission:MESSAGE_SERVER_SMS_AUTHORITY.SEND,
  label:() => globalProperties.$t('common.send',{name:globalProperties.$t('messageServer.sms.routePage')}),
  icon:() => createIcon('loncra-send'),
  run:() => void globalProperties.$router.push({name:MESSAGE_SERVER_SMS_ROUTE.SEND})
},{
  id: "template",
  permission:MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY.FIND,
  label:() => globalProperties.$t('messageServer.sms.template.routePage'),
  icon:() => createIcon('loncra-layout-template'),
  run:() => void globalProperties.$router.push({name:MESSAGE_SERVER_SMS_ROUTE.TEMPLATE})
},{
  id: "sign",
  permission:MESSAGE_SERVER_SMS_SIGN_AUTHORITY.FIND,
  label:() => globalProperties.$t('messageServer.sms.sign.routePage'),
  icon:() => createIcon('loncra-signature'),
  run:() => void globalProperties.$router.push({name:MESSAGE_SERVER_SMS_ROUTE.SIGN})
}])

const service = new SmsMessageService();

const columns = computed<SearchableColumnType[]>(() => [
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
  },
  {
    title: globalProperties.$t('common.channel'),
    dataIndex: "channel",
    ellipsis: true,
    width: 200,
    key:'channel',
    search:{
      component: markRaw(Select),
      props: {mode:'multiple', maxTagCount: 2, placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },{
    title: globalProperties.$t('common.phoneNumber'),
    dataIndex: "phoneNumber",
    ellipsis: true,
    key:'phone_number',
    width: 150,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  }, {
    title: globalProperties.$t('common.content'),
    dataIndex: "content",
    key:'content',
    ellipsis: true,
    width: 550,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
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
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]:[
      {"id":"ExecuteStatus"},{"id":"CloudChannelEnum"}
    ],
    [SYSTEM_MODULE_NAME.MESSAGE_SERVER]:[
      {"id":"MessageTypeEnum"}
    ]
  })
  if (enums.data) {
    applyColumnOptions(columns.value, "executeStatus", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.ExecuteStatus || [])
    applyColumnOptions(columns.value, "channel", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.CloudChannelEnum || [])
    applyColumnOptions(columns.value, "type", enums.data[SYSTEM_MODULE_NAME.MESSAGE_SERVER]?.MessageTypeEnum || [])
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
      export:MESSAGE_SERVER_SMS_AUTHORITY.EXPORT,
      detail:MESSAGE_SERVER_SMS_AUTHORITY.GET,
      delete:MESSAGE_SERVER_SMS_AUTHORITY.DELETE
    }"
    :scroll="{x:'max-content'}"
    :row-selection="props.preview ? false : {fixed: true, type: 'checkbox'}"
    @detail="r => globalProperties.$router.push({name:MESSAGE_SERVER_SMS_ROUTE.DETAIL, query:{id:String(r.id)}})"
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
      <template v-if="column.dataIndex === 'retryTime'">
        {{ dateTimeFormat(record.retryTime) }}
      </template>
      <template v-if="column.dataIndex === 'retryCount'">
        {{ record.retryCount  }} / {{ record.maxRetryCount }}
      </template>
      <template v-if="column.dataIndex === 'executeStatus'">
        <a-space>
          <template v-if="getEnumValue(record.executeStatus) === 99">
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
</template>
