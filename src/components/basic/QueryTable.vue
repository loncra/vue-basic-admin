<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";

import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onActivated,
  onMounted,
  provide,
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
  FindSearchService,
  PageRequest,
  PageResult,
  PageSearchService,
  RestResult,
  ScrollPageResult,
  TotalPage,
  TreeSortMetadata,
} from "@/types/apis";
import type {
  DropPosition,
  QueryTableProps,
  SearchableColumnType,
  TableActionAuth,
  TableActionContext,
  TableActionDefinition,
  TableActionPayload,
} from "@/types/composables";
import {TABLE_ACTION_CONTEXT_KEY} from "@/types/composables";
import {
  mergeDefinitions,
  resolveActions,
  useMergeRowSelection,
  useTableRowDrag
} from "@/composables/table";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import type {PageSearchRestfulService} from "@/apis/pageSearchRestfulService.ts";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import LActionButton from "@/components/basic/ActionButton.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {TablePaginationConfig} from "antdv-next/dist/table/interface";

defineOptions({
  name: 'LQueryTable',
  inheritAttrs: false,
})

const principalStore = usePrincipalStore()
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
  action: [payload: TableActionPayload<TEntity>]
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

const auth: TableActionAuth = {
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

const actionContext = computed<TableActionContext<TEntity>>(() => ({
  scope: 'table',
  table: {
    dataSource: dataSource.value,
    selectedRows: selectedRows.value,
    query: query.value,
  },
  extras: props.actionContextExtras ?? {},
}))

provide(TABLE_ACTION_CONTEXT_KEY, actionContext as unknown as typeof actionContext)

function createDefaultTableActions(): TableActionDefinition<TEntity>[] {
  return [
    {
      id: 'add',
      permission: props.authority?.add,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: () => globalProperties.$t('common.add', {name: ''}),
      icon: () => createIcon('icon-add', 'align'),
      run: (ctx) => emit('action', {id: 'add', context: ctx}),
    },
    {
      id: 'export',
      permission: props.authority?.export,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: (ctx) =>
        ctx.table.selectedRows.length > 0
          ? globalProperties.$t('common.export.selected', {count: ctx.table.selectedRows.length})
          : globalProperties.$t('common.export.all'),
      icon: () => createIcon('icon-goods-start-to-ship', 'align'),
      run: (ctx) => exportData(ctx.table.selectedRows),
    },
  ]
}

const titleActions = computed(() =>
  resolveActions(
    mergeDefinitions(createDefaultTableActions(), props.actions ?? []),
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
  return raw ?? {type: 'checkbox' as const}
})

const tablePassthroughAttrs = computed(() => {
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
    loading.value = true;
    const data:TEntity[] = [];
    if (typeof (props.service as PageSearchService<TEntity, TPage, TId>).page === 'function') {
      const result:RestResult<TPage> = await (props.service as PageSearchRestfulService<TEntity, TPage, TId>).page(query.value as PageRequest);
      data.push(...(result.data?.elements || []))
      if (tablePagination.value) {
        tablePagination.value.pageSize = result.data?.size || 10 ;
        const pageResult = result.data as unknown as PageResult<TEntity>
        if (pageResult.number) {
          tablePagination.value.current = pageResult.number
          const n =
            typeof pageResult.number === 'number' && Number.isFinite(pageResult.number)
              ? pageResult.number
              : ((query.value as PageRequest).number ?? 1)
          const rowCount = data.length
          if (pageResult.last) {
            tablePagination.value.total = (n - 1) * pageResult.size + rowCount
          } else {
            tablePagination.value.total = n * pageResult.size + 1
          }
        }

        const totalPage = result.data as unknown as TotalPage<TEntity>
        if (totalPage.totalCount) {
          tablePagination.value.total = totalPage.totalCount;
        }
      }

    } else if (typeof (props.service as FindSearchService<TEntity, TId>).find === 'function') {
      const result:RestResult<TEntity[]> = await (props.service as FindSearchService<TEntity, TId>).find(query.value as FilterRequest);
      data.push(...(result.data || []))
      if (tablePagination.value === undefined) {
        tablePagination.value = false;
      }
    }

    dataSource.value = data;
    syncPlacementBaseline(data);

  } finally {
    loading.value = false;
  }
}

async function exportData(records: TEntity[]) {
  let result:RestResult<void>;
  if (records.length > 0) {
    const filter:FilterRequest = {}
    filter["filter_[" + SYSTEM_CONSTANT.ID_NAME + "_in]"] = records.map(r => r.id);
    result = await props.service.exportData(filter);
  } else {
    result = await props.service.exportData(query.value);
  }

  message.success(result.message);
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
    :loading="loading"
    :bordered="props.bordered"
    :on-row="tableOnRow"
  >
    <template #title v-if="!props.hideTitle">
      <a-flex justify="space-between" class="pr-xs pl-xs" align="center">
        <a-space v-if="!slots.title">
          <icon-font class="icon align" :type="menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.icon || 'icon-survey'"/>
          <a-typography-text strong>{{ menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.name || '' }}</a-typography-text>
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
      <icon-font :class="'icon' + (filtered ? ' text-primary' : '')" type="icon-search"/>
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
                <icon-font class="icon align" type="icon-confirm"/>
              </template>
              <span>{{ globalProperties.$t('search.text') }}</span>
            </a-button>

            <a-button block @click="resetField(column, setSelectedKeys, confirm)">
              <template #icon>
                <icon-font class="icon align" type="icon-error"/>
              </template>
              <span>{{ globalProperties.$t('common.reset') }}</span>
            </a-button>

            <a-button block @click="clear(confirm, setSelectedKeys)">
              <template #icon>
                <icon-font class="icon align" type="icon-delete"/>
              </template>
              <span>{{globalProperties.$t('common.clear')}}</span>
            </a-button>
          </a-space-compact>
        </a-space>
      </div>
    </template>
  </a-table>
</template>

