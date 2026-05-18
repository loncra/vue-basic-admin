<script setup lang="ts">

import {AttachmentService} from "@/apis/resource-server/attachmentService.ts";
import {
  byteFormat,
  createIcon,
  dateTimeFormat,
  getEnumName,
  requireNonNullOrUndefined
} from "@/utils";
import type {MenuProps} from "antdv-next";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {ExportDataMetadata, FileObject} from "@/types/apis";
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {SearchableColumnType} from "@/types/composables";

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

const service = new AttachmentService();
const selectedRows = ref<ExportDataMetadata[]>([]);

const recordButtons:NonNullable<MenuProps['items']> = [{
  key: 'download',
  label: globalProperties.$t('common.download.text'),
  icon: () => createIcon('icon-download', 'align'),
}]

const titleButton:NonNullable<MenuProps['items']> = [{
  key: 'downloadSelected',
  label: globalProperties.$t('common.download.selected'),
  icon: () => createIcon('icon-download', 'align'),
}]

function actionButtonClick(key:string, record:ExportDataMetadata) {
  if (key === 'download') {
    const data = record?.metadata?.data as FileObject;
    if (!data) {
      return ;
    }
    const bucketName = data?.bucketName;
    const objectName = data?.objectName;
    if (!objectName || !bucketName) {
      return ;
    }
    service.download(bucketName, objectName);
  }
}

function titleButtonClick(key:string) {
  if (key === 'downloadSelected') {
    const files:FileObject[] = selectedRows.value
      .filter(item => item.executeStatus.value === 1)
      .map(item => item.metadata)
      .map(metadata => metadata.data as FileObject);
    service.downloads(files);
  }
}

function onSelectRow(
  _record:ExportDataMetadata,
  _selected:boolean,
  _selectedRows:ExportDataMetadata[]
) {
  selectedRows.value = _selectedRows;
}

</script>

<template>
  <l-crud-table
    :service="service"
    :columns="columns"
    :action-buttons="recordButtons"
    :title-buttons="titleButton"
    :scroll="{x:'max-content'}"
    :rowSelection="{type: 'checkbox', onSelect:onSelectRow}"
    :authority="{
      delete:true
    }"
    @title-button-click="titleButtonClick"
    @action-button-click="actionButtonClick"
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
