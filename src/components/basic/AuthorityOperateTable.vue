<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">
import type {
  BasicCrudService,
  BasicIdMetadata,
  CurdAuthorityProps,
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
import {App} from 'antdv-next'
import {usePrincipalStore} from '@/stores/principalStore'
import {createIcon} from '@/utils'
import type {MenuInfo} from '@v-c/menu'
import {useI18n} from 'vue-i18n'

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

defineOptions({
  name: 'LAuthorityOperateTable',
})

const principalStore = usePrincipalStore()
const slots = useSlots()
const { message, modal } = App.useApp()
const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    service: BasicCrudService<TBody, TEntity>
    immediate?: boolean,
    enabledActions?: boolean,
    rowSelection?: TableProps['rowSelection'],
    pagination?: TableProps['pagination']
    columns: SearchableColumnType[]
    authority?: CurdAuthorityProps
    actionItems?: NonNullable<MenuProps['items']>
  }>(),
  {
    immediate: true,
    columns: () => [],
    enabledActions: true,
    actionItems: () => []
  },
)

const emit = defineEmits<{
  edit: [record: TEntity]
  detail: [record: TEntity]
  actionItemClick: [e:MenuInfo, record: TEntity]
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
  options.value.actionItems = []
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
      title: t('common.operation'),
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      width: 80,
      fixed: 'right'
    })
    const actionItems = [];
    if (principalStore.hasAnyPermission([props.authority?.save || '', props.authority?.detail || ''])) {
      actionItems.push({
        key: 'edit',
        label: t('common.edit'),
        icon: () => createIcon('icon-edit'),
      })
    }
    if (principalStore.hasPermission(props.authority?.detail || '')) {
      actionItems.push({
        key: 'detail',
        label: t('common.detail'),
        icon: () => createIcon('icon-order-inspection'),
      })
    }
    if (principalStore.hasPermission(props.authority?.delete || '')) {
      actionItems.push({
        key: 'delete',
        label: t('common.delete'),
        icon: () => createIcon('icon-delete'),
      })
    }
    options.value.actionItems.push(...actionItems)
    if (props.actionItems.length > 0) {
      options.value.actionItems.push({type:'divider'});
      options.value.actionItems.push(...props.actionItems)
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
  if (typeof (props.service as PageCurdService<TBody,TEntity, TPage>).page === 'function') {
    const result:RestResult<TPage> = await (props.service as PageCurdService<TBody, TEntity, TPage>).page(query.value as PageRequest);
    data.push(...(result.data?.elements || []))
    const pagination:TableProps['pagination']  = { ...(props.pagination || {})};
    pagination.pageSize = result.data?.size || 10 ;

    const pageResult = result.data as unknown as PageResult<TEntity>
    if (pageResult.number) {
      pagination.current = pageResult.number;
      const n =
        typeof pageResult.number === 'number' && Number.isFinite(pageResult.number)
          ? pageResult.number
          : ((query.value as PageRequest).number ?? 1)
      const rowCount = data.length
      if (pageResult.last) {
        pagination.total = (n - 1) * pageResult.size + rowCount
      } else {
        pagination.total = n * pageResult.size + 1
      }
    }

    const totalPage = result.data as unknown as TotalPage<TEntity>
    if (totalPage.totalCount) {
      pagination.total = totalPage.totalCount;
    }

    options.value.pagination = pagination;

  } else if (typeof (props.service as FindCurdService<TBody, TEntity>).find === 'function') {
    const result:RestResult<TEntity[]> = await (props.service as FindCurdService<TBody, TEntity>).find(query.value as FilterRequest);
    data.push(...(result.data || []))
  }

  dataSource.value = data;
  loading.value = false;
}

function remove(records: TEntity[]) {
  if (records.length === 0) {
    return
  }
  const content =
    records.length === 1
      ? t('common.deleteConfirmSingle')
      : t('common.deleteConfirmBatch', {count: records.length})
  modal.confirm({
    title: t('common.deleteConfirmTitle'),
    content,
    onOk() {
      return props.service
      .delete(records.map(r => r.id))
      .then(r => message.success(r.message))
      .then(() => fetchDataSource())
      .catch(e => message.error(e.message))
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
  } else {
    emit('actionItemClick', e, record)
  }
}

function mounted() {
  if (props.immediate) {
    fetchDataSource();
  }
}

watch(
  () =>
    [
      props.columns,
      props.authority,
      props.rowSelection,
      principalStore.state.grantedAuthorities,
      locale.value,
    ] as const,
  () => rebuildAuthorityMeta(),
  {immediate: true, deep: true},
)

onMounted(mounted)

defineExpose({
  fetchDataSource,
  remove
})

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
    <template #bodyCell="{ text, record, index, column}">
      <slot v-if="hasBodyCell" name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>
      <template v-if="column.dataIndex === 'action'">
        <a-dropdown
          :trigger="['click']"
          :menu="{ items: options.actionItems, onClick: (e: MenuInfo) => handleActionClick(e, record) }"
          placement="bottomRight">
          <a-button size="small">
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
              <span>{{ t('common.search') }}</span>
            </a-button>
            <a-button block @click="resetField(column, setSelectedKeys, confirm)">
              <template #icon>
                <icon-font class="icon align" type="icon-error"/>
              </template>
              <span>{{ t('common.reset') }}</span>
            </a-button>
          </a-space-compact>
        </a-space>
      </div>
    </template>
  </a-table>
</template>
