<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import type {
  BasicCrudService,
  BasicIdMetadata,
  RestResult,
  ScrollPageResult,
  TreeSortMetadata,
} from "@/types/apis";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import {App} from "antdv-next";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref, useSlots,} from "vue";
import LActionButton from "@/components/basic/ActionButton.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {
  ActionAuth,
  ActionContext,
  ActionDefinition,
  ActionPayload,
  CurdTableProps,
  DropPosition,
  SearchableColumnType,
} from "@/types/composables";
import {mergeDefinitions, resolveActions} from "@/composables/action";
import LQueryTable from "@/components/basic/QueryTable.vue";

defineOptions({
  name: 'LCrudTable',
})

const { message, modal } = App.useApp()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

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

const auth: ActionAuth = {
  can: (permission) => {
    if (permission === undefined || permission === false) {
      return false
    }
    if (permission === true) {
      return true
    }
    return principalStore.hasPermission(permission as string) || !!permission
  },
}

function createDefaultBulkActions(): ActionDefinition<TEntity>[] {
  return [
    {
      id: 'deleteSelected',
      permission: props.authority?.delete,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      enabled: (ctx) =>
        ctx.selectedItems.length > 0 &&
        typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
      label: (ctx) =>
        globalProperties.$t('common.delete.selected', {count: ctx.selectedItems.length}),
      icon: () => createIcon('icon-delete'),
      run: (ctx) => remove(ctx.selectedItems),
    },
  ]
}

function createDefaultRowActions(): ActionDefinition<TEntity>[] {
  return [
    {
      id: 'edit',
      permission: props.authority?.edit,
      label: () => globalProperties.$t('common.edit', {name: ''}),
      icon: () => createIcon('icon-edit'),
      run: (ctx) => {
        if (ctx.record) {
          emit('edit', ctx.record)
        }
      },
    },
    {
      id: 'detail',
      permission: props.authority?.detail,
      label: () => globalProperties.$t('common.detail', {name: ''}),
      icon: () => createIcon('icon-order-inspection'),
      run: (ctx) => {
        if (ctx.record) {
          emit('detail', ctx.record)
        }
      },
    },
    {
      id: 'delete',
      permission: props.authority?.delete,
      enabled: () =>
        typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
      label: () => globalProperties.$t('common.delete.text'),
      icon: () => createIcon('icon-delete'),
      run: (ctx) => {
        if (ctx.record) {
          remove([ctx.record])
        }
      },
    },
  ]
}

const tableActions = computed(() =>
  mergeDefinitions(createDefaultBulkActions(), props.actions ?? []),
)

const rowActionDefinitions = computed(() =>
  mergeDefinitions(createDefaultRowActions(), props.rowActions ?? []),
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

function getToolbarActionContext(): ActionContext<TEntity> | undefined {
  const ctx = queryTable.value?.actionContext
  if (!ctx) {
    return undefined
  }
  return 'value' in ctx ? ctx.value as ActionContext<TEntity> : ctx as ActionContext<TEntity>
}

function buildRowContext(record: TEntity): ActionContext<TEntity> {
  const toolbarCtx = getToolbarActionContext()
  return {
    scope: 'item',
    record,
    items: toolbarCtx?.items ?? [],
    selectedItems: toolbarCtx?.selectedItems ?? [],
    query: toolbarCtx?.query,
    extras: toolbarCtx?.extras ?? props.actionContextExtras ?? {},
  }
}

function resolveRowActions(record: TEntity) {
  return resolveActions(rowActionDefinitions.value, buildRowContext(record), auth)
}

function onRowAction(id: string, record: TEntity) {
  if (['edit', 'detail', 'delete'].includes(id)) {
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

function remove(records: TEntity[]) {
  if (records.length === 0) {
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

async function doDelete(records: TEntity[]) {
  if (typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete !== 'function') {
    return ;
  }
  try {
    const result:RestResult<void> = await (props.service as BasicCrudService<TBody, TEntity, TId>).delete(records.map(r => r.id))
    message.success(result.message)
    await queryTable.value?.fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false;
  }
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
