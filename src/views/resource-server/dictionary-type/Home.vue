<script setup lang="ts">
import {getCurrentInstance, onActivated, onMounted, ref, watch} from 'vue'
import type {TableProps} from 'antdv-next'
import {CrudFormModal, CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {DictionaryTypeEntity} from '@loncra/client/resource'
import {findAllTreeNodes, findFirstTreeNode, unmergeTree} from '@loncra/client/commons'
import {dictionaryTypeFormPage} from './dictionary-type.form.page'
import {
  dictionaryTypeHomePage,
  dictionaryTypeModal,
  dictionaryTypeModalTitle,
} from './dictionary-type.home.page'

defineOptions({
  name: 'ResourceServerDictionaryTypeHome',
})

const emit = defineEmits<{
  select: [typeId?: number | string]
}>()

const globalProperties = getCurrentInstance()!.appContext.config.globalProperties
const table = ref<CrudHomePageExpose<DictionaryTypeEntity>>()

const cardClasses = {card: {root: 'rounded-none! border-0!', header: 'mb-0!', body: 'p-0!'}}
const rows = ref<DictionaryTypeEntity[]>([])
const openKeys = ref<number[]>([])
const selectedId = ref<number | string>()

const onRow: NonNullable<TableProps['onRow']> = (record) => ({
  onClick: (e: MouseEvent) => {
    const el = e.target as HTMLElement | null
    if (!el) {
      return
    }
    if (
      el.closest(
        'button, a, input, textarea, select, label, .ant-checkbox, .ant-checkbox-wrapper, [role="button"]',
      )
    ) {
      return
    }
    const item = record as DictionaryTypeEntity
    selectedId.value = item.id
    emit('select', item.id)
  },
})

function rowClassName(record: DictionaryTypeEntity): string {
  if (selectedId.value == null) {
    return ''
  }
  return String(selectedId.value) === String(record.id) ? 'text-link-active' : ''
}

function onExpandedRowsChange(keys: readonly (string | number)[]): void {
  openKeys.value = keys.map((key) => Number(key))
}

async function onSaved(): Promise<void> {
  await table.value?.fetchDataSource()
  dictionaryTypeModal.value.open = false
}

const pendingExpandId = ref<string>()

function expandTo(id: string): void {
  const data = findFirstTreeNode((r) => String(r.id) === id, rows.value)
  if (!data) {
    pendingExpandId.value = id
    return
  }
  pendingExpandId.value = undefined
  if (!data.parentId) {
    return
  }
  const parents = findAllTreeNodes((r) => r.id === data.parentId, rows.value)
  if (parents.length <= 0) {
    return
  }
  openKeys.value = unmergeTree(parents)
    .map((r) => r.id)
    .filter((id): id is number => id !== undefined)
}

watch(rows, () => {
  if (pendingExpandId.value) {
    expandTo(pendingExpandId.value)
  }
})

function queryTypeId(): string | undefined {
  const value = globalProperties.$route.query.typeId
  return typeof value === 'string' && value ? value : undefined
}

function restoreFromRoute(): void {
  const typeId = queryTypeId()
  if (!typeId) {
    return
  }
  selectedId.value = typeId
  emit('select', typeId)
  expandTo(typeId)
}

onMounted(restoreFromRoute)
onActivated(restoreFromRoute)
</script>

<template>
  <div>
    <crud-home-page
      ref="table"
      v-model:data-source="rows"
      :page="dictionaryTypeHomePage"
      :classes="cardClasses"
      :pagination="false"
      :bordered="false"
      :on-row="onRow"
      :row-class-name="rowClassName"
      :expandable="{
        expandedRowKeys: openKeys,
        onExpandedRowsChange: onExpandedRowsChange,
      }"
    >
      <template #title>
        <a-flex justify="space-between" align="center">
          <a-space>
            <icon-font icon="icon align" type="loncra-table-of-contents" />
            <a-typography-text strong>
              {{ $t('resourceServer.dictionaryType.routePage') }}
            </a-typography-text>
          </a-space>
        </a-flex>
      </template>
    </crud-home-page>

    <!--
      新增 / 修改弹层：字段与必填、父级 code 前缀、操作轨迹**全在声明里**
      （`dictionary-type.form.page.ts`）—— 这里只递"这一次为谁而开"：
      `id`（编辑态）/ `parentId` 与 `parentCode`（加子级）。保存成功刷左树后关弹层。
    -->
    <crud-form-modal
      v-model:open="dictionaryTypeModal.open"
      :page="dictionaryTypeFormPage"
      :id="dictionaryTypeModal.id"
      :title="dictionaryTypeModalTitle"
      :context-extra="{
        parentId: dictionaryTypeModal.parent?.id,
        parentCode: dictionaryTypeModal.parent?.code,
      }"
      @success="onSaved"
    />
  </div>
</template>
