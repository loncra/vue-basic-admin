<script setup lang="ts">

import {AttachmentService} from "@/apis/resource-server/attachmentService.ts";
import {
  byteFormat,
  createIcon,
  dateTimeFormat,
  getEnumName,
  requireNonNullOrUndefined
} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {ExportDataMetadata, FileObject} from "@/types/apis";
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import {UserExportService} from "@/apis/resource-server/userExportService.ts";

defineOptions({
  name: 'CommonUserExport',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const columns:SearchableColumnType[] = [{
  title: globalProperties.$t('common.creationTime'),
  dataIndex: "creationTime",
  ellipsis: true,
  key: "creationTime",
  width: 210
},{
  title: globalProperties.$t('resourceServer.attachment.filename'),
  dataIndex: "filename",
  ellipsis: true,
  key: "filename",
  width: 400
}, {
  title: globalProperties.$t('common.type'),
  dataIndex: "type",
  ellipsis: true,
  key: "type",
  width: 120
}, {
  title: globalProperties.$t('common.size'),
  dataIndex: "size",
  ellipsis: true,
  key: "size",
  width: 150
}, {
  title: globalProperties.$t('common.executeStatus'),
  dataIndex: "executeStatus",
  ellipsis: true,
  key:'executeStatus',
  width: 210
}, {
  title: globalProperties.$t('common.successTime'),
  dataIndex: "successTime",
  ellipsis: true,
  key:'successTime',
  width: 210
}, {
  title: globalProperties.$t('common.expiresTime'),
  dataIndex: "expiresTime",
  ellipsis: true,
  key:'expiresTime',
  width: 210
}]

const service = new UserExportService();
const selectedRows = ref<ExportDataMetadata[]>([]);

const rowActions: ActionDefinition<ExportDataMetadata>[] = [{
  id: 'download',
  permission: true,
  label: () => globalProperties.$t('common.download.text'),
  icon: () => createIcon('icon-download', 'align'),
  run: (ctx) => {
    if (!ctx.record) {
      return
    }
    downloadRecord(ctx.record)
  },
}]

const actions: ActionDefinition<ExportDataMetadata>[] = [{
  id: 'downloadSelected',
  permission: true,
  label: (ctx) => globalProperties.$t('common.download.selected',{count: ctx.selectedItems.length}),
  enabled: (ctx) => ctx.selectedItems.some((item) => item.executeStatus.value === 1),
  icon: () => createIcon('icon-download', 'align'),
  run: (ctx) => {
    const files: FileObject[] = ctx.selectedItems
      .filter((item) => item.executeStatus.value === 1)
      .map((item) => item.metadata)
      .map((metadata) => metadata.data as FileObject)
      AttachmentService.downloads(files)
  },
}]

function downloadRecord(record: ExportDataMetadata) {
  const data = record?.metadata?.data as FileObject;
  if (!data) {
    return ;
  }
  const bucketName = data?.bucketName;
  const objectName = data?.objectName;
  if (!objectName || !bucketName) {
    return ;
  }
  AttachmentService.download(bucketName, objectName);
}

</script>

<template>
  <l-crud-table
    :service="service"
    :columns="columns"
    :actions="actions"
    :row-actions="rowActions"
    v-model:selected-rows="selectedRows"
    :scroll="{x:'max-content'}"
    :row-selection="{type: 'checkbox'}"
    :authority="{
      delete:true
    }"
  >
    <template #bodyCell="{ column, record }">

      <template v-if="column.dataIndex === 'executeStatus'">
        {{getEnumName(record.executeStatus)}}
      </template>

      <template v-if="column.dataIndex === 'type'">
        {{ getEnumName(record.type) }}
      </template>

      <template v-if="column.dataIndex === 'creationTime'">
        {{ dateTimeFormat(record.creationTime) }}
      </template>

      <template v-if="column.dataIndex === 'successTime'">
        {{ dateTimeFormat(record.successTime) }}
      </template>
      <template v-if="column.dataIndex === 'expiresTime'">
        {{ dateTimeFormat(record.expiresTime) }}
      </template>

      <template v-if="column.dataIndex === 'size'">
        {{ byteFormat(record.size) }}
      </template>
    </template>
  </l-crud-table>
</template>
