<script setup lang="ts">
import {renderIconFont} from '@/utils/commonUtils'
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue';
import {
  applyColumnOptions,
  dateTimeFormat,
  requireNonNullOrUndefined,
} from '@/utils'
import type {SearchableColumnType, ToolbarActionDefinition} from '@loncra/antdv-pro';
import {CrudTable as LCrudTable, mergeDefinitions} from '@loncra/antdv-pro';
import {DateRangePicker, Input, Select} from "antdv-next";
import {ResourceServerService} from "@/apis";
import type {SiteMessageEntity} from "@loncra/client/message";
import {SiteMessageService} from "@loncra/client/message";

import type {FilterRequest, NameValueEnumMetadata, RestResult} from "@loncra/client/commons";
import type {EnumBucketsResponseBody} from "@loncra/client/resource";

import {
  EXECUTE_STATUS_TYPE,
  MESSAGE_SERVER_SITE_AUTHORITY,
  MESSAGE_SERVER_SITE_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  YES_OR_NO_TYPE
} from '@/constants';
import {getEnumName, getEnumValue} from '@loncra/client/commons'

defineOptions({
  name: 'LSiteTable',
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

const actionButtons = ref<ToolbarActionDefinition<SiteMessageEntity>[]>([{
  id: "send",
  permission:MESSAGE_SERVER_SITE_AUTHORITY.SEND,
  label:() => globalProperties.$t('common.send',{name:globalProperties.$t('messageServer.site.routePage')}),
  icon:() => renderIconFont('loncra-send'),
  run:() => void globalProperties.$router.push({name:MESSAGE_SERVER_SITE_ROUTE.SEND})
}])

const service = new SiteMessageService();

const columns = ref<SearchableColumnType<SiteMessageEntity>[]>([
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
    title: globalProperties.$t('auth.principal'),
    dataIndex: "toUser",
    ellipsis: true,
    key:'to_user',
    width: 150,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'eq'
    },
  }, {
    title: globalProperties.$t('messageServer.site.pushable'),
    dataIndex: "pushable",
    key:'pushable',
    ellipsis: true,
    width: 80
  }, {
    title: globalProperties.$t('common.read.time'),
    dataIndex: "readTime",
    key:'read_time',
    ellipsis: true,
    width: 210
  }
])

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({[SYSTEM_MODULE_NAME.RESOURCE_SERVER]:[{id:SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM},{id:SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM}],[SYSTEM_MODULE_NAME.MESSAGE_SERVER]:[{id:SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM}]})
  if (enums.data) {
    applyColumnOptions(columns.value, 'executeStatus', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM] ?? [])
    applyColumnOptions(columns.value, 'type', enums.data[SYSTEM_MODULE_NAME.MESSAGE_SERVER]?.[SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM] ?? [])
    applyColumnOptions(columns.value, 'channel', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM] ?? [])
  }
}

function getChannelsName(channels: (NameValueEnumMetadata<number> | number)[] = []) {
  return channels.map((v) => getEnumName(v)).join(',')
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
    :title="props.preview ? false : undefined"
    :authority="{
      detail:MESSAGE_SERVER_SITE_AUTHORITY.GET,
      delete:MESSAGE_SERVER_SITE_AUTHORITY.DELETE
    }"
    :scroll="{x:'max-content'}"
    :row-selection="props.preview ? false : {fixed: true, type: 'checkbox'}"
    @detail="r => globalProperties.$router.push({name:MESSAGE_SERVER_SITE_ROUTE.DETAIL, query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'creationTime'">
        {{ dateTimeFormat(record.creationTime) }}
      </template>
      <template v-if="column.dataIndex === 'successTime'">
        {{ dateTimeFormat(record.successTime) }}
      </template>
      <template v-if="column.dataIndex === 'redTime'">
        {{dateTimeFormat(record.readTime)}}
      </template>
      <template v-if="column.dataIndex === 'pushable'">
        <a-tooltip v-if="getEnumValue(record.pushable) === YES_OR_NO_TYPE.YES">
          <template #title>
            {{globalProperties.$t('messageServer.site.channel')}}:{{getChannelsName(record.channels)}}
          </template>
          <span>
          {{ getEnumName(record.pushable) }}
          </span>
        </a-tooltip>
      </template>
      <template v-if="column.dataIndex === 'retryCount'">
        {{ record.retryCount  }} / {{ record.maxRetryCount }}
      </template>
      <template v-if="column.dataIndex === 'retryTime'">
        {{ dateTimeFormat(record.retryTime) }}
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
</template>
