<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import type {BasicIdMetadata, ScrollPageResult, TreeSortMetadata,} from "@/types/apis";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import {App} from "antdv-next";
import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref, useSlots,} from "vue";
import LActionButton from "@/components/basic/ActionButton.vue";
import LQueryTable from "@/components/basic/QueryTable.vue";
import type {
  ActionContext,
  ActionPayload,
  CurdTableProps,
  DropPosition,
  SearchableColumnType,
} from "@/types/composables";
import {
  buildItemActionContext,
  BUILTIN_ITEM_ACTION_IDS,
  createDefaultBulkActions,
  createDefaultItemActions,
  mergeDefinitions,
  resolveActions,
  useActionAuth,
  useCrudDelete,
} from "@/composables/action";

defineOptions({
  name: 'LCrudTable',
})

const { message, modal } = App.useApp()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const auth = useActionAuth()

const queryTable = ref<{
  fetchDataSource: () => Promise<void>
  exportData: (records: TEntity[]) => Promise<void>
  actionContext?: ActionContext<TEntity>
}>()

const loading = defineModel<boolean>('loading', {default: () => false})
const selectedRows = defineModel<TEntity[]>('selectedRows', {default: () => []})

const emit = defineEmits<{
  action: [payload: ActionPayload<TEntity>]
  add:[]
  edit: [record: TEntity]
  detail: [record: TEntity]
  drop: [sorts: TreeSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
  treeDrop: [
    sorts: TreeSortMetadata<TId>[],
    drag: TEntity,
    target: TEntity,
    payload: { dropPosition: DropPosition; tree: TEntity[] },
  ]
}>()

const props = withDefaults(
  defineProps<CurdTableProps<TBody, TEntity, TPage, TId>>(),
  {
    recordActions: true,
    bordered:true,
    immediate:true,
    pagination:() => ({hideOnSinglePage: true, placement: ['bottomCenter']}),
  },
)

const slots = useSlots()

const t = globalProperties.$t.bind(globalProperties)

const {remove} = useCrudDelete<TBody, TEntity, TId>({
  service: props.service,
  t,
  modal,
  message,
  loading,
  refresh: () => queryTable.value?.fetchDataSource(),
})

const tableActions = computed(() =>
  mergeDefinitions(
    createDefaultBulkActions<TBody, TEntity, TId>({
      authority: props.authority,
      service: props.service,
      t,
      remove,
    }),
    props.actions ?? [],
  ),
)

const rowActionDefinitions = computed(() =>
  mergeDefinitions(
    createDefaultItemActions<TBody, TEntity, TId>({
      authority: props.authority,
      service: props.service,
      t,
      remove,
      onEdit: (record) => emit('edit', record),
      onDetail: (record) => emit('detail', record),
    }),
    props.rowActions ?? [],
  ),
)

const displayColumns = computed<SearchableColumnType[]>(() => {
  const cols = [...props.columns]
  if (props.recordActions && rowActionDefinitions.value.some((def) => auth.can(def.permission))) {
    cols.push({
      title: globalProperties.$t('common.action'),
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      fixed: 'right',
    })
  }
  return cols
})

function buildRowContext(record: TEntity): ActionContext<TEntity> {
  return buildItemActionContext({
    record,
    toolbarContext: queryTable.value?.actionContext,
    actionContextExtras: props.actionContextExtras,
  })
}

function resolveRowActions(record: TEntity) {
  return resolveActions(rowActionDefinitions.value, buildRowContext(record), auth)
}

function onRowAction(id: string, record: TEntity) {
  if (BUILTIN_ITEM_ACTION_IDS.includes(id as (typeof BUILTIN_ITEM_ACTION_IDS)[number])) {
    return
  }
  emit('action', {id, context: buildRowContext(record)})
}

function onTableAction(payload: ActionPayload<TEntity>) {
  if (payload.id === 'add') {
    emit('add')
  }
  emit('action', payload)
}

function fetchDataSource() {
  return queryTable.value?.fetchDataSource()
}

function exportData() {
  return queryTable.value?.exportData(selectedRows.value)
}

defineExpose({
  fetchDataSource,
  exportData,
  remove,
})

</script>

<template>
  <l-query-table
    ref="queryTable"
    :hide-title="props.hideTitle"
    :columns="displayColumns"
    :actions="tableActions"
    :action-context-extras="props.actionContextExtras"
    :bordered="props.bordered"
    :drag="props.drag"
    :format-drag-preview="props.formatDragPreview"
    :on-row="props.onRow"
    :authority="props.authority"
    :service="props.service"
    :pagination="props.pagination"
    :immediate="props.immediate"
    v-bind="$attrs"
    :row-selection="props.rowSelection"
    v-model:loading="loading"
    v-model:selected-rows="selectedRows"
    @action="onTableAction"
    @drop="(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)"
    @tree-drop="(sorts, drag, target, payload) => emit('treeDrop', sorts, drag, target, payload)"
  >
    <template #title v-if="slots.title">
      <slot name="title"/>
    </template>
    <template #bodyCell="{ text, record, index, column}">

      <slot v-if="slots.bodyCell" name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>

      <template v-if="column.dataIndex === 'action'">
        <l-action-button
          size="small"
          :actions="resolveRowActions(record as TEntity)"
          @action="(id) => onRowAction(id, record as TEntity)"
        />
      </template>
    </template>
  </l-query-table>
</template>
