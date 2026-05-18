<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import type {
  BasicCrudService,
  BasicIdMetadata,
  RestResult,
  ScrollPageResult,
  TreeSortMetadata,
} from "@/types/apis";
import type {TreeDropPosition} from "@/utils/treeUtils";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import {App, type MenuProps} from "antdv-next";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref, useSlots, watch} from "vue";
import LActionButton from "@/components/basic/ActionButton.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {CurdTableProps, SearchableColumnType} from "@/types/composables";
import LQueryTable from "@/components/basic/QueryTable.vue";

defineOptions({
  name: 'LCrudTable'
})

const { message, modal } = App.useApp()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const queryTable = ref();

const loading = defineModel<boolean>('loading', {default: () => false})

const emit = defineEmits<{
  add:[]
  titleButtonClick:[key:string]
  edit: [record: TEntity]
  detail: [record: TEntity]
  actionButtonClick: [e:string, record: TEntity]
  drop: [sorts: TreeSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
  treeDrop: [
    sorts: TreeSortMetadata<TId>[],
    drag: TEntity,
    target: TEntity,
    payload: { dropPosition: TreeDropPosition; tree: TEntity[] },
  ]
}>()

const props = withDefaults(
  defineProps<CurdTableProps<TBody, TEntity, TPage, TId>>(),
  {
    enabledRecordActions:true,
    enabledTitleActions:true,
    bordered:true,
    immediate:true,
    pagination:() => ({hideOnSinglePage: true, placement: ['bottomCenter']}),
    renderActionItems: (record: TEntity, actionItems: NonNullable<MenuProps['items']>) => actionItems,
  },
)

const slots = useSlots()

const options = ref<{
  columns:SearchableColumnType[]
  titleButtons:NonNullable<MenuProps['items']>
  actionButtons:NonNullable<MenuProps['items']>
  selectedRow:TEntity[]
}>({
  columns:[],
  titleButtons:[],
  actionButtons:[],
  selectedRow:[]
})

function handleActionClick(key: string | number, record: TEntity) {
  const k = String(key)
  if (k === 'edit') {
    emit('edit', record)
  } else if (k === 'detail') {
    emit('detail', record)
  } else if (k === 'delete') {
    remove([record])
  } else {
    emit('actionButtonClick', k, record)
  }
}

function remove(records: TEntity[]) {
  if (records.length === 0) {
    return
  }
  const content =
    records.length === 1
      ? globalProperties.$t('common.deleteConfirmSingle')
      : globalProperties.$t('common.deleteConfirmBatch', {count: records.length})
  modal.confirm({
    title: globalProperties.$t('common.deleteConfirmTitle'),
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
    await queryTable.value.fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false;
  }
}

function rebuildActionItems() {
  options.value.actionButtons = []
  options.value.titleButtons = []
  options.value.columns = []

  if (props.enabledRecordActions) {

    if (principalStore.hasPermission(props.authority?.edit as string) || props.authority?.edit) {
      options.value.actionButtons.push({
        key: 'edit',
        label: globalProperties.$t('common.edit',{name:''}),
        icon: () => createIcon('icon-edit'),
      })
    }
    if (principalStore.hasPermission(props.authority?.detail as string) || props.authority?.detail) {
      options.value.actionButtons.push({
        key: 'detail',
        label: globalProperties.$t('common.detail',{name:''}),
        icon: () => createIcon('icon-order-inspection'),
      })
    }
    if ((principalStore.hasPermission(props.authority?.delete as string) || props.authority?.delete) && typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function') {
      options.value.actionButtons.push({
        key: 'delete',
        label: globalProperties.$t('common.delete'),
        icon: () => createIcon('icon-delete'),
      })
    }

  }

  if ((principalStore.hasPermission(props.authority?.delete as string) || props.authority?.delete) && typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function') {
    options.value.titleButtons.push({
      key: 'deleteSelected',
      label: globalProperties.$t('common.deleteSelected'),
      icon: () => createIcon('icon-delete'),
    })
  }

  options.value.titleButtons.push(...props.titleButtons || [])

  options.value.actionButtons.push(...props.actionButtons || [])
  options.value.columns.push(...props.columns)
  if (options.value.actionButtons.length > 0 && props.enabledRecordActions) {
    options.value.columns.push({
      title: globalProperties.$t('common.action'),
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      fixed: 'right'
    })
  }

}

function fetchDataSource() {
  return queryTable.value.fetchDataSource()
}

function exportData() {
  return queryTable.value.exportData()
}

watch(
  () =>
    [
      props.enabledRecordActions,
      props.actionButtons,
    ] as const,
  () => rebuildActionItems(),
  {immediate: true, deep: true},
)

defineExpose({
  fetchDataSource,
  exportData,
  remove
})

</script>

<template>
  <l-query-table
    ref="queryTable"
    :hide-title="props.hideTitle"
    :columns="options.columns"
    :titleButtons="options.titleButtons"
    :enabled-title-actions="props.enabledTitleActions"
    :bordered="props.bordered"
    :drag="props.drag"
    :format-drag-preview="props.formatDragPreview"
    :on-row="props.onRow"
    :authority="props.authority"
    :service="props.service"
    :pagination="props.pagination"
    :immediate="props.immediate"
    v-bind="$attrs"
    v-model:loading="loading"
    @title-button-add="emit('add')"
    @title-append-button-click="(key:string) => emit('titleButtonClick',key)"
    @drop="(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)"
    @tree-drop="(sorts, drag, target, payload) => emit('treeDrop', sorts, drag, target, payload)"
  >
    <template #title v-if="slots.title">
      <slot name="title"/>
    </template>
    <template #bodyCell="{ text, record, index, column}">

      <slot v-if="slots.bodyCell" name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>

      <template v-if="column.dataIndex === 'action'">
        <l-action-button size="small" :action-items="props.renderActionItems(record, options.actionButtons)" @action-item-click="(key) => handleActionClick(key, record)" />
      </template>
    </template>
  </l-query-table>
</template>
