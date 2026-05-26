<script setup lang="ts">

import {AttachmentService} from "@/apis/resource-server/attachmentService.ts";
import {byteFormat, createIcon, dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  markRaw,
  nextTick,
  onMounted,
  ref
} from "vue";
import type {FilterRequest, ObjectItemInfo, RestResult} from "@/types/apis";
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import {FileManagerService} from "@/apis/resource-server/fileManagerService.ts";
import {Input} from "antdv-next";
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'CommonUserExport',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const columns:SearchableColumnType[] = [{
  title: globalProperties.$t('resourceServer.attachment.filename'),
  dataIndex: "filename",
  ellipsis: true,
  key: "filename",
  width: 650,
  search:{
    component: markRaw(Input),
    props:{placeholder: globalProperties.$t('search.placeholder.input')},
    queryName:'filename'
  },
},{
  title: globalProperties.$t('common.owner'),
  dataIndex: "uploader",
  ellipsis: true,
  key: "uploader",
  width: 200
},  {
  title: globalProperties.$t('resourceServer.attachment.fileSize'),
  dataIndex: "size",
  ellipsis: true,
  key: "size",
  width: 150
}, {
  title: globalProperties.$t('resourceServer.attachment.lastModified'),
  dataIndex: "lastModified",
  ellipsis: true,
  key: "lastModified",
  width: 210
}]

const service = new FileManagerService();
const selectedRows = ref<ObjectItemInfo[]>([]);
const segmented = ref<{
  data:Record<string, unknown>[]
  value:string,
  loading:boolean
}>({
  data:[],
  value:'',
  loading:false
})

const query = ref<FilterRequest>({
  type:'',
  filename:null
});
const loading = ref<boolean>(false);

const table = ref();
const {message, modal} = useApp()

const rowActions: ActionDefinition<ObjectItemInfo>[] = [{
  id: 'download',
  permission: true,
  label: () => globalProperties.$t('common.download.text'),
  icon: () => createIcon('icon-download', 'align'),
  run: (ctx) => {
    if (!ctx.record) {
      return
    }
    AttachmentService.download(segmented.value.value, ctx.record.objectName)
  },
},{
  id: 'delete',
  permission: true,
  label: () => globalProperties.$t('common.delete.text'),
  icon: () => createIcon('icon-delete', 'align'),
  run: (ctx) => {
    if (!ctx.record) {
      return
    }
    onDelete([ctx.record])
  },
}]

const actions: ActionDefinition<ObjectItemInfo>[] = [{
  id: 'downloadSelected',
  permission: true,
  label: (ctx) => globalProperties.$t('common.download.selected',{count: ctx.selectedItems.length}),
  enabled: () => true,
  icon: () => createIcon('icon-download', 'align'),
  run: (ctx) => AttachmentService.downloads(ctx.selectedItems.map(k => ({bucketName: segmented.value.value, objectName: k.objectName})))
},{
  id: 'deleteSelected',
  permission: true,
  label: (ctx) => globalProperties.$t('common.delete.selected',{count: ctx.selectedItems.length}),
  enabled: () => true,
  icon: () => createIcon('icon-delete', 'align'),
  run: (ctx) => onDelete(ctx.selectedItems)
}]

async function onSegmented(value:string) {
  segmented.value.value = value
  await nextTick()

  query.value.type = value;
  table.value.fetchDataSource();
}

function onDelete(records: ObjectItemInfo[]) {
  if (records.length <= 0) {
    return
  }
  const content =
    records.length === 1
      ? globalProperties.$t('common.delete.confirmSingle')
      : globalProperties.$t('common.delete.confirmBatch', {count: records.length})
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content,
    onOk: () => doDelete(records),
  })
}

async function doDelete(records: ObjectItemInfo[]) {
  try {
    loading.value = true
    const result:RestResult<void> = await AttachmentService.removeAttachment(records.map(k => ({bucketName: segmented.value.value, objectName: k.objectName})))
    message.success(result.message)
    table.value.fetchDataSource();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {

    loading.value = false
  }
}

async function mounted() {
  try {
    segmented.value.loading = true;
    const result:RestResult<Record<string, unknown>[]> = await AttachmentService.buckets()
    segmented.value.data = result.data || [];
    if (segmented.value.data.length > 0) {
      await onSegmented(String(segmented.value.data.at(0)?.value || ''))
    }
  } finally {
    segmented.value.loading = false;
  }
}

onMounted(mounted)
</script>

<template>
  <div >
    <div class="bg-container p-sm mb-md rounded-lg border border-border-secondary">
      <a-segmented v-model:value="segmented.value" block :options="segmented.data" @change="onSegmented">
        <template #labelRender="{name, size, objects}">
          <a-typography-text strong>{{ name }}({{objects || 0}})</a-typography-text>
          <div>使用空间:{{ byteFormat(size || 0)}}</div>
        </template>

      </a-segmented>
    </div>
    <l-crud-table
      ref="table"
      :service="service"
      :columns="columns"
      :immediate="false"
      :actions="actions"
      :loading="loading"
      :query="query"
      :row-actions="rowActions"
      v-model:selected-rows="selectedRows"
      :scroll="{x:'max-content'}"
      :row-selection="{type: 'checkbox'}"
      :authority="{
        delete:'perms[resource_server_attachment:delete]'
      }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'uploader' && !record.dir">
          {{ record?.userMetadata['X-Amz-Meta-Uploader-Id'] }}
        </template>
        <template v-if="column.dataIndex === 'filename'">
          {{record?.userMetadata['X-Amz-Meta-Original-Filename'] || record.objectName}}
        </template>
        <template v-if="column.dataIndex === 'lastModified' && !record.dir">
          {{ dateTimeFormat(record.lastModified) }}
        </template>

        <template v-if="column.dataIndex === 'size'">
          {{ byteFormat(record.size) }}
        </template>
      </template>
    </l-crud-table>
  </div>
</template>
