<script setup lang="ts" generic="TEntity extends BasicIdMetadata<TId>, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">
import type {
  BasicCrudService,
  BasicIdMetadata,
  FilterRequest,
  FindCurdService,
  PageCurdService,
  PageRequest,
  PageResult,
  RestResult,
  ScrollPageResult,
  TotalPage,
} from '@/types'
import {type Component, computed, onMounted, ref, useSlots, watch} from 'vue'
import type {ColumnType} from "antdv-next/dist/table/interface";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {MenuProps, TableProps} from "antdv-next";
import { usePrincipalStore } from '@/stores/principalStore'
import { createIcon } from '@/utils'
import { App } from 'antdv-next'
import type { MenuInfo } from '@v-c/menu'
/** 列定义上挂载的查询区配置（非 antdv 内置字段） */
export interface ColumnSearchConfig {
  component?: Component
  props?: Record<string, unknown>
  expression?: string,
  queryName?: string
}

export type SearchableColumnType<RecordType = Record<string, unknown>> = ColumnType<RecordType> & {
  search?: ColumnSearchConfig
}

export interface CurdAuthorityProps {
  save?:string
  detail?:string
  delete?:string
  view?:string
  export?:string
}

defineOptions({
  name: 'LAuthorityOperateTable',
})


const principalStore = usePrincipalStore()
const slots = useSlots()
const { message, modal } = App.useApp();

const props = withDefaults(
  defineProps<{
    service: BasicCrudService<TEntity>
    immediate?: boolean,
    enabledActions?: boolean,
    rowSelection?: TableProps['rowSelection'],
    pagination?: TableProps['pagination']
    columns: SearchableColumnType[]
    authority?: CurdAuthorityProps
  }>(),
  {
    immediate: true,
    columns: () => [],
    enabledActions: true
  },
)

const emit = defineEmits<{
  edit: [record: TEntity]
  detail: [record: TEntity]
}>()

const dataSource = defineModel<TEntity[]>('dataSource', {default: () => []})
const loading = defineModel('loading', {default: () => false})

const query = defineModel<FilterRequest | PageRequest>('query', {default: () => ({})})
const selectedRecords = defineModel<TEntity[]>('selectedRows', {default: () => []})

const hasBodyCell = computed(() => Boolean(slots.bodyCell))

const options = ref<{
  columns: SearchableColumnType[]
  pagination?: TableProps['pagination']
  rowSelection?: TableProps['rowSelection']
  actionItems: NonNullable<MenuProps['items']>
}>({
  columns: [],
  pagination: {},
  actionItems: [],
})

function syncColumnFilteredValue(column: SearchableColumnType) {
  if (!column.search?.queryName) return
  const raw = query.value[column.search.queryName]
  const active =
    raw !== undefined &&
    raw !== null &&
    raw !== '' &&
    !(Array.isArray(raw) && raw.length === 0) // 若有过数组条件再微调
  const col = options.value.columns.find((c) => c.key === column.key)
  if (!col) return
  col.filteredValue = active ? [String(raw)] : null
}

function search(
  column: SearchableColumnType,
  setSelectedKeys: (strings: string[]) => void,
  confirm: () => void
) {
  if (column.search?.queryName) {
    const value = query.value[column.search.queryName] ?? ''
    const keys = value !== '' && value != null ? [String(value)] : []
    setSelectedKeys(keys)
    syncColumnFilteredValue(column)
  }
  confirm()
  fetchDataSource()
}

function resetField(
  column: SearchableColumnType,
  setSelectedKeys: (strings: string[]) => void,
  confirm: () => void
) {
  if (column.search && column.search.queryName) {
    query.value[column.search.queryName] = '';
    syncColumnFilteredValue(column)
  }
  setSelectedKeys([])
  confirm();
  fetchDataSource();
}

function rebuildAuthorityMeta() {
  options.value.columns = []
  const cols = props.columns ?? []
  for (const col of cols) {
    const optionsCol: SearchableColumnType = {...col};
    options.value.columns.push(optionsCol)
    if (!optionsCol.search || !optionsCol.search.component ||!principalStore.hasPermission(props.authority?.view || '')) {
      continue
    }
    optionsCol.filterDropdown = () => null;
    optionsCol.search.queryName = `filter_[${col.key}_${optionsCol.search.expression || 'eq'}]`
  }

  if (props.enabledActions && principalStore.hasAnyPermission([props.authority?.save || '', props.authority?.detail || '', props.authority?.delete || ''])) {
    options.value.columns.push({
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      width: 80,
      fixed: 'right'
    })
    options.value.actionItems = []
    if (principalStore.hasAnyPermission([props.authority?.save || '', props.authority?.detail || ''])) {
      options.value.actionItems.push({
        key: 'edit',
        label: '编辑',
        icon: () => createIcon('icon-edit'),
      })
    }
    if (principalStore.hasPermission(props.authority?.detail || '')) {
      options.value.actionItems.push({
        key: 'detail',
        label: '详情',
        icon: () => createIcon('icon-order-inspection'),
      })
    }
    if (principalStore.hasPermission(props.authority?.delete || '')) {
      options.value.actionItems.push({
        key: 'delete',
        label: '删除',
        icon: () => createIcon('icon-delete'),
      })
    }
  }

  if (principalStore.hasPermission(props.authority?.delete || '')) {
    const userOnChange = props.rowSelection?.onChange
    options.value.rowSelection = {
      ...props.rowSelection,
      type: 'checkbox',
      onChange: (selectedRowKeys, selectedRows, info) => {
        selectedRecords.value = selectedRows as TEntity[]
        userOnChange?.(selectedRowKeys, selectedRows, info)
      },
    }
  } else {
    options.value.rowSelection = undefined
    selectedRecords.value = []
  }
}

async function fetchDataSource() {
  if (!principalStore.hasPermission(props.authority?.view || '')) {
    return
  }
  loading.value = true;
  const data:TEntity[] = [];
  if (typeof (props.service as PageCurdService<TEntity, TPage>).page === 'function') {
    const result:RestResult<TPage> = await (props.service as PageCurdService<TEntity, TPage>).page(query.value as PageRequest);
    data.push(...(result.data?.elements || []))
    const pagination:TableProps['pagination']  = (props.pagination || {});
    pagination.pageSize = result.data?.size || 10 ;

    const pageResult = result.data as unknown as PageResult<TEntity>
    if (pageResult.number) {
      pagination.current = pageResult.number;
    }

    const totalPage = result.data as unknown as TotalPage<TEntity>
    if (typeof totalPage.totalCount) {
      pagination.total = totalPage.totalCount;
    }

    options.value.pagination = pagination;

  } else if (typeof (props.service as FindCurdService<TEntity>).find === 'function') {
    const result:RestResult<TEntity[]> = await (props.service as FindCurdService<TEntity>).find(query.value as FilterRequest);
    data.push(...(result.data || []))
  }

  dataSource.value = data;
  loading.value = false;
}

function remove(records: TEntity[]) {
  modal.confirm({
    title: '删除确认',
    content: '确定要删除该记录吗？',
    onOk() {
      return props.service.delete(records.map(r => r.id)).then(r => message.success(r.message)).catch(e => message.error(e.message))
    },
  })
}

function handleActionClick(e: MenuInfo, record: TEntity) {
  if (e.key === 'edit') {
    emit('edit', record)
  } else if (e.key === 'detail') {
    emit('detail', record)
  } else if (e.key === 'delete') {
    remove([record])
  }
}

function mounted() {  
  if (props.immediate) {
    fetchDataSource();
  }
}

watch(
  () => [props.columns, props.authority, props.rowSelection, principalStore.state.grantedAuthorities] as const,
  () =>rebuildAuthorityMeta(),
  {immediate: true, deep: true},
)

onMounted(mounted)

</script>

<template>
  <a-table
    :columns="options.columns"
    :pagination="options.pagination"
    :row-selection="options.rowSelection"
    v-bind="$attrs"
    :data-source="dataSource"
    :loading="loading"
    bordered
  >
    <template v-if="hasBodyCell" #bodyCell="{ text, record, index, column}">
      <slot name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>
      <template v-if="column.dataIndex === 'action'">
        <a-dropdown :menu="{ items: options.actionItems, onClick: (e: MenuInfo) => handleActionClick(e, record) }" placement="bottomRight">
          <a-button>
            <template #icon>
              <icon-font class="icon" type="icon-more"/>
            </template>
          </a-button>
        </a-dropdown>
      </template>
    </template>
    <template #filterIcon="{filtered}" v-if="principalStore.hasPermission(props.authority?.view || '')">
      <icon-font :class="'icon' + (filtered ? ' text-primary' : '')" type="icon-search"/>
    </template>
    <template #filterDropdown="{column, setSelectedKeys, confirm}" v-if="principalStore.hasPermission(props.authority?.view || '')">
      <div class="p-md" @keydown.stop>
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
              <span>搜索</span>
            </a-button>
            <a-button block @click="resetField(column, setSelectedKeys, confirm)">
              <template #icon>
                <icon-font class="icon align" type="icon-error"/>
              </template>
              <span>重置</span>
            </a-button>
          </a-space-compact>
        </a-space>
      </div>
    </template>
  </a-table>
</template>
