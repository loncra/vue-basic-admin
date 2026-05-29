<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import {dateTimeFormat, getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {SearchableColumnType} from "@/types/composables";
import {SmsTemplateService} from "@/apis/message-server/sms/templateService.ts";

defineOptions({
  name: 'MessageServerSmsTemplateHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new SmsTemplateService('alibabaCloud')

const columns = ref<SearchableColumnType[]>([{
  title: globalProperties.$t('common.channel'),
  dataIndex: "channel",
  ellipsis: true,
  width: 150
}, {
  title: globalProperties.$t('common.creationTime'),
  dataIndex: "creationTime",
  ellipsis: true,
  width: 210
}, {
  title: globalProperties.$t('common.code'),
  dataIndex: "id",
  ellipsis: true,
  width: 150
}, {
  title: globalProperties.$t('common.name'),
  dataIndex: "name",
  ellipsis: true,
  width: 150
}, {
  title: globalProperties.$t('common.type'),
  dataIndex: "type",
  ellipsis: true,
  width: 150
}, {
  title: globalProperties.$t('common.content'),
  dataIndex: "content",
  ellipsis: true,
  width: 350
}, {
  title: globalProperties.$t('common.status'),
  dataIndex: "status",
  ellipsis: true,
  width: 200
}, {
  title: globalProperties.$t('common.auditionTime'),
  dataIndex: "auditionTime",
  ellipsis: true,
  width: 210
}])


</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :service="service"
    :columns="columns"
    :authority="{
      detail:'perms[message_server_sms_template:get]'
    }"
    :scroll="{x:'max-content'}"
    @detail="r => globalProperties.$router.push({name:'message_server_sms_template_detail', query:{id:r.id}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'creationTime'">
        {{ dateTimeFormat(record.creationTime) }}
      </template>
      <template v-if="column.dataIndex === 'channel'">
        {{ getEnumName(record.channel) }}
      </template>
      <template v-if="column.dataIndex === 'type'">
        {{ getEnumName(record.type) }}
      </template>
      <template v-if="column.dataIndex === 'status'">
        {{ getEnumName(record.status) }}
      </template>
      <template v-if="column.dataIndex === 'auditionTime'">
        <template v-if="getEnumValue(record.channel) === 'alibabaCloud'">
          {{record?.metadata?.rejectDate}}
        </template>
      </template>
    </template>
  </l-crud-table>
</template>
