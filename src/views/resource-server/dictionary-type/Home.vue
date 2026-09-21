<script setup lang="ts">
import {onActivated, onMounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import type {TableProps} from 'antdv-next'
import {CrudHomePage as LCrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {DictionaryTypeEntity} from '@loncra/client/resource'
import {findAllTreeNodes, findFirstTreeNode, unmergeTree} from '@loncra/client/commons'
import LModalForm from '@/components/basic/form/ModalForm.vue'
import {OPERATION_DATA_TRACE_TABLE} from '@/constants'
import {dictionaryTypeService} from './dictionary-type.page'
import {
  dictionaryTypeHomePage,
  dictionaryTypeModal,
  dictionaryTypeModalTitle,
  emptyDictionaryTypeEntity,
} from './dictionary-type.home.page'

/**
 * 字典类型树（字典页左半边，被 `dictionary/Home.vue` 嵌入）。
 *
 * - **这一侧不进路由**：没有 Form / Detail 页，新增与修改都是本页的 `l-modal-form` 弹层；
 * - 选中哪个类型通过 `select` 抛给外层，右半边（字典数据）按它加载。
 */
defineOptions({
  name: 'ResourceServerDictionaryTypeHome',
})

const emit = defineEmits<{
  /** 选中变化（`route.query.typeId` 恢复出来的也算） */
  select: [typeId?: number | string]
}>()

const route = useRoute()
const table = ref<CrudHomePageExpose<DictionaryTypeEntity>>()
const rows = ref<DictionaryTypeEntity[]>([])
const openKeys = ref<number[]>([])
const formRef = ref()
/** 选中行高亮用的 id */
const selectedId = ref<number | string>()

/** 点行选中：写下选中并交给外层（避开行内的按钮 / 勾选框 / 输入） */
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

/** 选中行高亮（旧实现同款 class） */
function rowClassName(record: DictionaryTypeEntity): string {
  if (selectedId.value == null) {
    return ''
  }
  return String(selectedId.value) === String(record.id) ? 'text-link-active' : ''
}

/** 树展开键受控（恢复选中时要按父链自动展开） */
function onExpandedRowsChange(keys: readonly (string | number)[]): void {
  openKeys.value = keys.map((key) => Number(key))
}

/** 弹层保存成功：刷左树 → 关弹层（`l-modal-form` 的 `cancel` 会复位表单并 emit `cancel`） */
async function onSaved(): Promise<void> {
  await table.value?.fetchDataSource()
  formRef.value?.cancel?.()
}

/** 弹层取消/关闭：实体复位（下次进来是空表单） */
function onCancel(): void {
  dictionaryTypeModal.value.entity = emptyDictionaryTypeEntity()
}

/** 待展开的类型 id：首次挂载时左树数据还在飞，数据到了再补展开 */
const pendingExpandId = ref<string>()

/** 展开到某个类型（把它父链上的节点都展开）；数据还没到就记下来等 `watch(rows)` */
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

/** 路由 query 里的 `typeId`（可能是数组 / 空 ⇒ 只认非空字符串） */
function queryTypeId(): string | undefined {
  const value = route.query.typeId
  return typeof value === 'string' && value ? value : undefined
}

/**
 * 按路由的 `typeId` 恢复选中（挂载 + 每次切回）：先选中并交给外层（右表立刻按它加载），
 * 父链展开等左树数据到位 —— 从右半边的 Form 页返回时也走这里。
 */
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
    <l-crud-home-page
      ref="table"
      v-model:data-source="rows"
      :page="dictionaryTypeHomePage"
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
    </l-crud-home-page>

    <l-modal-form
      ref="formRef"
      v-model:open="dictionaryTypeModal.open"
      v-model:entity="dictionaryTypeModal.entity"
      :service="dictionaryTypeService"
      :title="dictionaryTypeModalTitle"
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.DICTIONARY_TYPE"
      @success="onSaved"
      @cancel="onCancel"
    >
      <a-form-item name="name" :label="$t('common.name')" :rules="[{required: true}]">
        <a-input v-model:value="dictionaryTypeModal.entity.name" />
      </a-form-item>
      <a-form-item name="code" :label="$t('common.code')" :rules="[{required: true}]">
        <a-input v-model:value="dictionaryTypeModal.entity.code">
          <template #prefix v-if="dictionaryTypeModal.parent">
            {{ dictionaryTypeModal.parent.code + '.' }}
          </template>
        </a-input>
      </a-form-item>
    </l-modal-form>
  </div>
</template>
