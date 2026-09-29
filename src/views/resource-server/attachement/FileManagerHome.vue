<script setup lang="ts">
import {byteFormat, CrudHomePage as LCrudHomePage, useDateFormat} from '@loncra/antdv-pro'
import {nextTick, onMounted, ref} from 'vue'
import type {FilterRequest, RestResult} from '@loncra/client/commons'
import {AttachmentService, type ObjectItemInfo} from '@loncra/client/resource'
import {fileManagerBucket, fileManagerHomePage} from './file-manager.home.page'
import {fileManagerService} from './file-manager.page'
import {DataLoadingCardPlan as LDataLoadingCardPlan} from '@loncra/antdv-pro'
/**
 * 文件管理（`FileManagerHome.vue`）：列 / 搜索 / 行内动作 / 批量动作 / 权限 / 行选择**全在声明**
 * （`file-manager.home.page.ts`，那里也写了"为什么这几样留在壳"）。
 *
 * 壳只剩三件：① 顶部 bucket 分段控件（**页面结构**，先于表格存在 —— 切它要改查询条件并重取）；
 * ② 目录树（展开态 + 点目录懒加载子级）；③ 单元格的画法（要前两样状态 ⇒ 走 `#bodyCell`）。
 */
defineOptions({
  // 旧名是 `CommonUserExport`（复制粘贴留下的，还与 `MyResourceHome.vue` **撞名** ⇒ keep-alive 会当成同一个）
  // ⇒ 按房规改：`<模块><子模块><形态>`
  name: 'ResourceServerFileManagerHome',
})

const {dateTimeFormat} = useDateFormat()

/** 表格实例：切 bucket 后要手动重取（`immediate: false` ⇒ 首屏由下面的 `onSegmented` 触发） */
const table = ref<{fetchDataSource?: () => void}>()

const query = ref<FilterRequest>({
  type: '',
  filename: null,
})

/**
 * bucket 分段控件的数据。
 *
 * ⚠️ 旧版这里还有一个 `loading` 字段 —— 它**只在 `mounted()` 里赋值、没人读**（死状态，已删）。
 * "切分段器时表格转圈"靠的是**另一个** ref：壳里那份 `:loading` 双向绑给 `CrudTable`，
 * 而 `fetchDataSource()` 自己会开关它（`BasicCrudQuery.fetchDataSource`）。现在那个模型归表格自己
 * ⇒ 切 bucket 照旧转圈（壳只要调 `fetchDataSource()`）。
 */
const segmented = ref<{
  data: Record<string, unknown>[]
  value: string
}>({
  data: [],
  value: '',
})

/** 目录树的展开态（`onDirClick` 的懒加载也会改它） */
const expandedRowKeys = ref<string[]>([])

async function onSegmented(value: string): Promise<void> {
  segmented.value.value = value
  // 声明里的动作（下载 / 删除）要 `bucketName` ⇒ 写进那个模块级 ref
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

/** 首屏：先拉 bucket 列表 → 选中第一个 → 由此触发第一次取数（旧版同款） */
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
    <l-data-loading-card-plan>
      <a-segmented class="mb-lg" v-model:value="segmented.value" block :options="segmented.data" @change="onSegmented">
        <template #labelRender="{name, size, objects}">
          <a-typography-text strong>{{ name }}({{ objects || 0 }})</a-typography-text>
          <div>{{ $t('common.used') }}:{{ byteFormat(size || 0)}}</div>
        </template>
      </a-segmented>
<!--    <div class="bg-container p-sm mb-md rounded-lg border border-border-secondary">
      <a-segmented v-model:value="segmented.value" block :options="segmented.data" @change="onSegmented">
        <template #labelRender="{name, size, objects}">
          <a-typography-text strong>{{ name }}({{ objects || 0 }})</a-typography-text>
          <div>{{ $t('common.used') }}:{{ byteFormat(size || 0)}}</div>
        </template>
      </a-segmented>
    </div>-->
    <!--
      表格 = **列表声明**的嵌入形态：`plain`（无卡片壳，与旧版同款）+ `immediate: false`
      （首屏不自己取数，由壳 `onSegmented` 拿到 bucket 后手动 `fetchDataSource()` —— 旧版同一个顺序）。
    -->
      <l-crud-home-page
        ref="table"
        plain
        :title="false"
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
      </l-crud-home-page>

    </l-data-loading-card-plan>
  </div>
</template>
