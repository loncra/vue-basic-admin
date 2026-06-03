<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";

import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onActivated,
  onMounted,
  provide,
  type Ref,
  ref,
  toRef,
  useAttrs,
  useSlots,
  watch
} from "vue";
import {App, type TableProps} from "antdv-next";
import type {
  BasicIdMetadata,
  FilterRequest,
  PageRequest,
  ScrollPageResult,
  TreeSortMetadata,
} from "@/types/apis";
import type {
  ActionContext,
  ActionPayload,
  DropPosition,
  QueryTableProps,
  SearchableColumnType,
} from "@/types/composables";
import {ACTION_CONTEXT_KEY} from "@/types/composables";
import {
  createDefaultToolbarActions,
  mergeDefinitions,
  resolveActions,
  useActionAuth
} from "@/composables/basic/action";
import {
  type CollectionPagination,
  fetchCollectionData
} from "@/composables/basic/data/usePageDataFetch.ts";
import {exportCollectionData} from "@/composables/basic/data/exportCollectionData.ts";
import {useMergeRowSelection, useTableRowDrag} from "@/composables/basic/table";
import {requireNonNullOrUndefined} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import LActionButton from "@/components/basic/ActionButton.vue";
import type {TablePaginationConfig} from "antdv-next/dist/table/interface";

defineOptions({
  name: 'LQueryTable',
  inheritAttrs: false,
})

const menuPrincipalStore = useMenuPrincipalStore()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const { message } = App.useApp()
const slots = useSlots()
const attrs = useAttrs()

const props = withDefaults(
  defineProps<QueryTableProps<TBody, TEntity, TPage, TId>>(),
  {
    hideTitle:false,
    bordered:true,
    immediate: true,
    pagination:() => ({hideOnSinglePage: true, placement: ['bottomCenter']}),
    columns: () => [],
  },
)

const dataSource = defineModel<TEntity[]>('dataSource', {default: () => []})
const loading = defineModel<boolean>('loading', {default: () => false})
const query = defineModel<FilterRequest | PageRequest>('query', {default: () => ({})})
const selectedRows = defineModel<TEntity[]>('selectedRows', {default: () => []})

const emit = defineEmits<{
  action: [payload: ActionPayload<TEntity>]
  drop: [sorts: TreeSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
  treeDrop: [
    sorts: TreeSortMetadata<TId>[],
    drag: TEntity,
    target: TEntity,
    payload: { dropPosition: DropPosition; tree: TEntity[] },
  ]
}>()

const {
  tableOnRow,
  applyDragColumn,
  isDragCell,
  onDragHandleStart,
  onDragHandleEnd,
  syncPlacementBaseline,
} = useTableRowDrag<TEntity, TId>({
  drag: toRef(props, 'drag'),
  dataSource,
  formatDragPreview: (record) => props.formatDragPreview?.(record) ?? String(record[SYSTEM_CONSTANT.ID_NAME]),
  onRow: toRef(props, 'onRow'),
  onFlatDrop: ({sorts, target, fromIndex, toIndex}) => emit('drop', sorts, target, fromIndex, toIndex),
  onTreeDrop: ({sorts, drag, target, dropPosition, tree}) =>
    emit('treeDrop', sorts, drag, target, {dropPosition, tree}),
})

const tableColumns = ref<SearchableColumnType[]>([])
const tablePagination = ref<TableProps['pagination']>()
const skipActivatedOnce = ref(true)

const auth = useActionAuth()

const actionContext = computed<ActionContext<TEntity>>(() => ({
  scope: 'toolbar',
  items: dataSource.value,
  selectedItems: selectedRows.value,
  query: query.value,
  extras: props.actionContextExtras ?? {},
}))

provide(ACTION_CONTEXT_KEY, actionContext as unknown as typeof actionContext)

const defaultTableActions = computed(() =>
  createDefaultToolbarActions<TEntity>({
    authority: props.authority,
    t: globalProperties.$t.bind(globalProperties),
    onAdd: (ctx) => emit('action', {id: 'add', context: ctx}),
    onExport: (ctx) => exportData(ctx.selectedItems),
  }),
)

const titleActions = computed(() =>
  resolveActions(
    mergeDefinitions(defaultTableActions.value, props.actions ?? []),
    actionContext.value,
    auth,
  ),
)

const needsBulkRowSelection = computed(() => {
  if (auth.can(props.authority?.export) || auth.can(props.authority?.delete)) {
    return true
  }
  return (props.actions ?? []).some((a) => a.id === 'deleteSelected' || a.id === 'downloadSelected')
})

const externalRowSelection = computed((): TableProps['rowSelection'] | false | null => {
  const raw = (props.rowSelection ?? attrs.rowSelection) as TableProps['rowSelection'] | false | undefined
  if (raw === false) {
    return null
  }
  if (raw === undefined && !needsBulkRowSelection.value) {
    return null
  }
  return raw ?? {fixed:true, type: 'checkbox' as const}
})

const tablePassthroughAttrs = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {rowSelection: _rowSelection, ...rest} = attrs
  return rest
})

const {rowSelection: mergedRowSelection} = useMergeRowSelection(externalRowSelection, selectedRows)

function search(
  column: SearchableColumnType,
  setSelectedKeys: (strings: string[]) => void,
  confirm: () => void
) {
  if (column.search?.queryName) {
    const value = query.value[column.search.queryName] ?? ''
    const keys = value !== '' && value != null ? [String(value)] : []
    setSelectedKeys(keys)
  }

  confirm()
  fetchDataSource()

}

function clear(
  confirm: () => void,
  setSelectedKeys: (strings: string[]) => void
) {

  tableColumns.value.filter(c => c.search && c.search.queryName).forEach(c => {
    query.value[c.search?.queryName ?? ''] = '';
    c.filteredValue = null
  })

  setSelectedKeys([])
  confirm();
  fetchDataSource();

}

function onChange(
  pagination: TablePaginationConfig
) {

  query.value.number = pagination.current
  query.value.size = pagination.pageSize || 10
  fetchDataSource();

}

function onFilterEnterKey(
  e: KeyboardEvent,
  column: SearchableColumnType,
  setSelectedKeys: (strings: string[]) => void,
  confirm: () => void,
) {

  if (e.key !== 'Enter' || e.shiftKey) {
    return
  }

  const el = e.target as HTMLElement | null
  if (!el || el.tagName === 'TEXTAREA' || el.isContentEditable) {
    return
  }

  if (el.closest('.ant-select') || el.closest('.ant-picker')) {
    return
  }

  const input = el.closest('input')
  if (!input) {
    return
  }

  if (['button', 'checkbox', 'radio'].includes(input.type)) {
    return
  }

  e.preventDefault()
  search(column, setSelectedKeys, confirm)

}

function resetField(
  column: SearchableColumnType,
  setSelectedKeys: (strings: string[]) => void,
  confirm: () => void
) {

  if (column.search && column.search.queryName) {
    query.value[column.search.queryName] = '';
  }

  setSelectedKeys([])
  confirm();
  fetchDataSource();

}

function rebuildColumns() {
  const cols: SearchableColumnType[] = []
  for (const col of props.columns ?? []) {
    const optionsCol: SearchableColumnType = {...col};
    cols.push(optionsCol)
    if (!optionsCol.search || !optionsCol.search.component) {
      continue
    }

    optionsCol.filterDropdown = () => null;
    if (!optionsCol.search.queryName) {
      optionsCol.search.queryName = `filter_[${col.key}_${optionsCol.search.expression || 'eq'}]`
    }

    if (optionsCol.search.defaultValue) {
      query.value[optionsCol.search.queryName] = optionsCol.search.defaultValue;
    }
  }

  tableColumns.value = applyDragColumn(cols)

}

async function fetchDataSource() {
  try {
    loading.value = true
    dataSource.value = await fetchCollectionData({
      service: props.service,
      query: query.value,
      pagination: tablePagination as Ref<CollectionPagination | undefined>,
    })
    syncPlacementBaseline(dataSource.value)
  } finally {
    loading.value = false
  }
}

async function exportData(records: TEntity[]) {
  const result = await exportCollectionData({
    service: props.service,
    query: query.value,
    records,
  })
  message.success(result.message)
  globalProperties.$router.push({name:'user_export'})
}

async function mounted() {
  tablePagination.value = props.pagination
  if (props.immediate && skipActivatedOnce.value) {
    await fetchDataSource();
    skipActivatedOnce.value = false;
  }
}

function activated() {
  if (skipActivatedOnce.value) {
    return;
  }
  fetchDataSource();
  skipActivatedOnce.value = true;
}

watch(
  () => [props.columns, props.drag] as const,
  () => rebuildColumns(),
  {immediate: true, deep: true},
)

watch(
  dataSource,
  (tree) => {
    if (!props.drag) {
      return
    }
    syncPlacementBaseline(tree)
  },
  {deep: true},
)

onActivated(activated)

onMounted(mounted)

defineExpose({
  fetchDataSource,
  exportData,
  actionContext,
})

</script>

<template>
  <a-table
    :columns="tableColumns"
    :pagination="tablePagination"
    v-bind="tablePassthroughAttrs"
    :row-key="SYSTEM_CONSTANT.ID_NAME"
    :data-source="dataSource"
    :row-selection="mergedRowSelection"
    @change="onChange"
    :classes="{content:'rounded-none'}"
    :loading="loading"
    :bordered="props.bordered"
    :on-row="tableOnRow"
  >
    <template #title v-if="!props.hideTitle">
      <a-flex justify="space-between" class="pr-xs pl-xs" align="center">
        <a-space v-if="!slots.title">
          <icon-font class="icon align" :type="menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.icon || 'loncra-file'"/>
          <a-typography-title :level="5" class="mb-0">{{ menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.name || '' }}</a-typography-title>
        </a-space>
        <slot v-else name="title" />
        <l-action-button :actions="titleActions"/>
      </a-flex>
    </template>

    <template #bodyCell="{ text, record, index, column }">
      <template v-if="isDragCell(column)">
        <div
          class="text-center cursor-grab"
          draggable="true"
          @dragstart="onDragHandleStart(record, $event)"
          @dragend="onDragHandleEnd"
        >
          <a-typography-text type="secondary">
            ::
          </a-typography-text>
        </div>
      </template>
      <slot v-if="slots.bodyCell" name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>
    </template>

    <template #filterIcon="{filtered}">
      <icon-font :class="'icon' + (filtered ? ' text-primary' : '')" type="loncra-search"/>
    </template>

    <template #filterDropdown="{column, setSelectedKeys, confirm}" >
      <div
        class="p-md"
        @keydown.stop
        @keydown.enter="onFilterEnterKey($event, column as SearchableColumnType, setSelectedKeys, confirm)"
      >
        <a-space orientation="vertical">
          <component
            :is="column.search.component"
            v-bind="column.search.props"
            v-model:value="query[column.search.queryName]"
          />

          <a-space-compact block>
            <a-button block type="primary" @click="search(column, setSelectedKeys, confirm)">
              <template #icon>
                <icon-font class="icon" type="loncra-check"/>
              </template>
              <span>{{ globalProperties.$t('search.text') }}</span>
            </a-button>

            <a-button block @click="resetField(column, setSelectedKeys, confirm)">
              <template #icon>
                <icon-font class="icon" type="loncra-time-reset"/>
              </template>
              <span>{{ globalProperties.$t('common.reset') }}</span>
            </a-button>

            <a-button block @click="clear(confirm, setSelectedKeys)">
              <template #icon>
                <icon-font class="icon" type="loncra-archive-x"/>
              </template>
              <span>{{globalProperties.$t('common.clear')}}</span>
            </a-button>
          </a-space-compact>
        </a-space>
      </div>
    </template>
  </a-table>
</template>

