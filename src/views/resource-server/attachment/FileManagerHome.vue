<script setup lang="ts">
import {byteFormat, CrudHomePage, DataLoadingCard, useDateFormat} from '@loncra/antdv-pro'
import {nextTick, onMounted, ref} from 'vue'
import type {FilterRequest, RestResult} from '@loncra/client/commons'
import {AttachmentService, type ObjectItemInfo} from '@loncra/client/resource'
import {fileManagerBucket, fileManagerHomePage} from './file-manager.home.page'
import {fileManagerService} from './file-manager.page'

defineOptions({
  name: 'ResourceServerFileManagerHome',
})

const {dateTimeFormat} = useDateFormat()

const table = ref<{fetchDataSource?: () => void}>()

const query = ref<FilterRequest>({
  type: '',
  filename: null,
})

const segmented = ref<{
  data: Record<string, unknown>[]
  value: string
}>({
  data: [],
  value: '',
})

const expandedRowKeys = ref<string[]>([])

async function onSegmented(value: string): Promise<void> {
  segmented.value.value = value
  fileManagerBucket.value = value
  await nextTick()

  query.value.type = value
  table.value?.fetchDataSource?.()
}

async function onDirClick(record: ObjectItemInfo): Promise<void> {
  if (!record.dir) {
    return
  }
  if (!record.children) {
    try {
      record.loading = true
      const result: RestResult<ObjectItemInfo[]> = await fileManagerService.find({
        type: segmented.value.value,
        filename: record.objectName,
      })
      record.children = result.data ?? []
      if (!expandedRowKeys.value.includes(record.id)) {
        record.children
          .filter((child) => child.dir)
          .forEach((child) => {
            child.userMetadata = {}
            child.userMetadata['X-Amz-Meta-Original-Filename'] = child.objectName
              .replaceAll(record.objectName, '')
              .replaceAll('/', '')
          })
        expandedRowKeys.value = [...expandedRowKeys.value, record.id]
      }
    } finally {
      record.loading = false
    }
    return
  }
  expandedRowKeys.value = expandedRowKeys.value.some((key) => key === record.id)
    ? expandedRowKeys.value.filter((key) => key !== record.id)
    : [...expandedRowKeys.value, record.id]
}

async function mounted(): Promise<void> {
  const result: RestResult<Record<string, unknown>[]> = await AttachmentService.buckets()
  segmented.value.data = result.data || []
  if (segmented.value.data.length > 0) {
    await onSegmented(String(segmented.value.data.at(0)?.value || ''))
  }
}

onMounted(mounted)
</script>

<template>
  <div>
    <data-loading-card>
      <a-segmented class="mb-lg" v-model:value="segmented.value" block :options="segmented.data" @change="onSegmented">
        <template #labelRender="{name, size, objects}">
          <a-typography-text strong>{{ name }}({{ objects || 0 }})</a-typography-text>
          <div>{{ $t('common.used') }}:{{ byteFormat(size || 0)}}</div>
        </template>
      </a-segmented>

      <crud-home-page
        ref="table"
        plain
        :title="false"
        :pagination="false"
        :page="fileManagerHomePage"
        :query="query"
        :immediate="false"
        :scroll="{x:'max-content', y:500}"
        :expandable="{
          expandedRowKeys:expandedRowKeys,
          expandIcon: () => null,
          onExpandedRowsChange:(rows:string[]) => expandedRowKeys = rows
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'uploader' && !record.dir">
            {{ record?.userMetadata['X-Amz-Meta-Uploader-Id'] }}
          </template>
          <template v-if="column.dataIndex === 'filename'">
            <a-space :class="record.dir ? 'cursor-pointer' : undefined" @click="onDirClick(record)">
              <icon-font v-if="!record.loading" class="icon align" :type="record.dir ? (expandedRowKeys.includes(record.id) ? 'loncra-folder-open' : 'loncra-folder-closed') : 'loncra-file'" />
              <icon-font v-else class="icon align" type="loncra-loader-pinwheel" spin/>

              <template v-if="!record.dir">{{record?.userMetadata?.['X-Amz-Meta-Original-Filename'] || record.objectName}}</template>
              <template v-else>
                {{(record?.userMetadata?.['X-Amz-Meta-Original-Filename'] || record.objectName).replaceAll('/','')}}
              </template>
            </a-space>
          </template>
          <template v-if="column.dataIndex === 'lastModified' && !record.dir">
            {{ dateTimeFormat(record.lastModified) }}
          </template>
          <template v-if="column.dataIndex === 'size'">
            <span>{{ record.size > 0 ? byteFormat(record.size) : '—' }}</span>
          </template>
        </template>
      </crud-home-page>

    </data-loading-card>
  </div>
</template>
