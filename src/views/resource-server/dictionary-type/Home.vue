<script setup lang="ts">
import {onActivated, onMounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import type {TableProps} from 'antdv-next'
import {CrudFormModal as LCrudFormModal, CrudHomePage as LCrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {DictionaryTypeEntity} from '@loncra/client/resource'
import {findAllTreeNodes, findFirstTreeNode, unmergeTree} from '@loncra/client/commons'
import {dictionaryTypeFormPage} from './dictionary-type.form.page'
import {
  dictionaryTypeHomePage,
  dictionaryTypeModal,
  dictionaryTypeModalTitle,
} from './dictionary-type.home.page'

/**
 * 字典类型树（字典页左半边，被 `dictionary/Home.vue` 嵌入）。
 *
 * - **这一侧不进路由**：没有 Form / Detail 页，新增与修改都是本页的 `l-crud-form-modal` 弹层；
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

/**
 * 卡片外观：走 `classes`（`classes` 是**唯一**通到 plan 的 `Card` 的通道 ——
 * 门面 / 表格的 `$attrs` 里只有它被显式转给基类，见 `QueryTable.tsx:478`）。
 * 去边框、去圆角 + 卡体贴边（表格不再被 body 的内边距挤进去）。
 * `header: 'mb-0!'` 是必须的：antdv-next 的卡片头自带 `margin-bottom: -1px`
 * （`dist/card/style/index.js` 的 head 段），会被卡体里第一个有背景的子块压掉那 1px ⇒
 * 卡片头的下边框看不见；去掉负边距即可（`p-0!` 也不会再遮住它）。
 * ⚠️ 别用 `variant="borderless"`：那个 prop 名被 `CrudHomePage` 的**页面形态名**占了。
 */
const cardClasses = {root: 'rounded-none! border-0!', header: 'mb-0!', body: 'p-0!'}
const rows = ref<DictionaryTypeEntity[]>([])
const openKeys = ref<number[]>([])
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

/**
 * 弹层保存成功：刷左树 → 关弹层。
 *
 * 不再需要"复位实体"：弹层内容是**每次打开重挂载**（`CrudFormModal` 的 `v-if`）⇒ 下一次一定是新的表单。
 */
async function onSaved(): Promise<void> {
  await table.value?.fetchDataSource()
  dictionaryTypeModal.value.open = false
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
    </l-crud-home-page>

    <!--
      新增 / 修改弹层：字段与必填、父级 code 前缀、操作轨迹**全在声明里**
      （`dictionary-type.form.page.ts`）—— 这里只递"这一次为谁而开"：
      `id`（编辑态）/ `parentId` 与 `parentCode`（加子级）。保存成功刷左树后关弹层。
    -->
    <l-crud-form-modal
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
