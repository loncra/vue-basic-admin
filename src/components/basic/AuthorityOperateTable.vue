<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">
import type {
  BasicCrudService,
  BasicIdMetadata,
  FilterRequest,
  FindSearchService,
  PageRequest,
  PageResult,
  PageSearchService,
  RestResult,
  ScrollPageResult,
  TableAuthorityProps,
  TotalPage,
} from '@/types'
import {
  type Component,
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onActivated,
  onMounted,
  ref,
  useSlots,
  watch
} from 'vue'
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {MenuProps, TableProps} from "antdv-next";
import {App} from 'antdv-next'
import {usePrincipalStore} from '@/stores/principalStore'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import type {PageSearchRestfulService} from '@/apis/pageSearchRestfulService';
import type {
  ColumnType,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
  TablePaginationConfig,
} from "antdv-next/dist/table/interface";
import LActionButton from "@/components/basic/ActionButton.vue";

/** 列定义上挂载的查询区配置（非 antdv 内置字段） */
export interface ColumnSearchConfig {
  component?: Component
  props?: Record<string, unknown>
  expression?: string,
  queryName?: string,
  defaultValue?: unknown
}

export type SearchableColumnType<RecordType = Record<string, unknown>> = ColumnType<RecordType> & {
  search?: ColumnSearchConfig
}

export interface AuthorityOperateTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: FindSearchService<TEntity, TId> | PageSearchService<TEntity, TPage, TId> | BasicCrudService<TBody, TEntity, TId>
  immediate?: boolean
  enabledActions?: boolean
  bordered?: boolean
  pagination?: TableProps['pagination']
  columns: SearchableColumnType[]
  authority?: TableAuthorityProps
  actionItems?: NonNullable<MenuProps['items']>
  renderActionItems?: (record: TEntity, actionItems: NonNullable<MenuProps['items']>) => NonNullable<MenuProps['items']>
}

defineOptions({
  name: 'LAuthorityOperateTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()
const slots = useSlots()
const { message, modal } = App.useApp()

const props = withDefaults(
  defineProps<AuthorityOperateTableProps<TBody, TEntity, TPage, TId>>(),
  {
    pagination:undefined,
    bordered:true,
    immediate: true,
    columns: () => [],
    enabledActions: true,
    actionItems: () => [],
    renderActionItems: (record: TEntity, actionItems: NonNullable<MenuProps['items']>) => actionItems,
  },
)

const emit = defineEmits<{
  edit: [record: TEntity]
  detail: [record: TEntity]
  actionItemClick: [e:string, record: TEntity]
}>()

const dataSource = defineModel<TEntity[]>('dataSource', {default: () => []})
const loading = defineModel('loading', {default: () => false})

const query = defineModel<FilterRequest | PageRequest>('query', {default: () => ({})})

const hasBodyCell = computed(() => Boolean(slots.bodyCell))
const hasTitle = computed(() => Boolean(slots.title))

const options = ref<{
  columns: SearchableColumnType[]
  skipActivatedOnce:boolean,
  pagination?: TableProps['pagination']
  actionItems: NonNullable<MenuProps['items']>,
}>({
  skipActivatedOnce:true,
  columns: [],
  actionItems: [],
})

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
  options.value.columns.filter(c => c.search && c.search.queryName).forEach(c => {
    query.value[c.search?.queryName ?? ''] = '';
    c.filteredValue = null
  })
  setSelectedKeys([])
  confirm();
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

function rebuildAuthorityMeta() {
  options.value.columns = []
  options.value.actionItems = []
  const cols = props.columns ?? []
  for (const col of cols) {
    const optionsCol: SearchableColumnType = {...col};
    options.value.columns.push(optionsCol)
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

  if (props.enabledActions && principalStore.hasAnyPermission([props.authority?.edit || '', props.authority?.detail || '', props.authority?.delete || ''])) {
    options.value.columns.push({
      title: globalProperties.$t('common.action'),
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      width: 80,
      fixed: 'right'
    })
    const actionItems = [];
    if (principalStore.hasPermission(props.authority?.edit || '')) {
      actionItems.push({
        key: 'edit',
        label: globalProperties.$t('common.edit',{name:''}),
        icon: () => createIcon('icon-edit'),
      })
    }
    if (principalStore.hasPermission(props.authority?.detail || '')) {
      actionItems.push({
        key: 'detail',
        label: globalProperties.$t('common.detail',{name:''}),
        icon: () => createIcon('icon-order-inspection'),
      })
    }
    if (principalStore.hasPermission(props.authority?.delete || '') && typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function') {
      actionItems.push({
        key: 'delete',
        label: globalProperties.$t('common.delete'),
        icon: () => createIcon('icon-delete'),
      })
    }
    options.value.actionItems.push(...actionItems)
    if (props.actionItems.length > 0) {
      options.value.actionItems.push({type:'divider'});
      options.value.actionItems.push(...props.actionItems)
    }
  }
}

async function fetchDataSource() {
  try {
    loading.value = true;
    const data:TEntity[] = [];
    if (typeof (props.service as PageSearchRestfulService<TEntity, TPage, TId>).page === 'function') {
      const result:RestResult<TPage> = await (props.service as PageSearchRestfulService<TEntity, TPage, TId>).page(query.value as PageRequest);
      data.push(...(result.data?.elements || []))
      if (options.value.pagination) {

        options.value.pagination.pageSize = result.data?.size || 10 ;

        const pageResult = result.data as unknown as PageResult<TEntity>
        if (pageResult.number) {
          options.value.pagination.current = pageResult.number;
          const n =
            typeof pageResult.number === 'number' && Number.isFinite(pageResult.number)
              ? pageResult.number
              : ((query.value as PageRequest).number ?? 1)
          const rowCount = data.length
          if (pageResult.last) {
            options.value.pagination.total = (n - 1) * pageResult.size + rowCount
          } else {
            options.value.pagination.total = n * pageResult.size + 1
          }
        }

        const totalPage = result.data as unknown as TotalPage<TEntity>
        if (totalPage.totalCount) {
          options.value.pagination.total = totalPage.totalCount;
        }
      }

    } else if (typeof (props.service as FindSearchService<TEntity, TId>).find === 'function') {
      const result:RestResult<TEntity[]> = await (props.service as FindSearchService<TEntity, TId>).find(query.value as FilterRequest);
      data.push(...(result.data || []))
      if (options.value.pagination === undefined) {
        options.value.pagination = false;
      }
    }

    dataSource.value = data;
  } finally {
    loading.value = false;
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
    await fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false;
  }
}

function handleActionClick(key: string | number, record: TEntity) {
  const k = String(key)
  if (k === 'edit') {
    emit('edit', record)
  } else if (k === 'detail') {
    emit('detail', record)
  } else if (k === 'delete') {
    remove([record])
  } else {
    emit('actionItemClick', k, record)
  }
}

function onChange(
  pagination: TablePaginationConfig,
  filters: Record<string, FilterValue | null>,
  sorter: SorterResult<TEntity> | SorterResult<TEntity>[],
  extra: TableCurrentDataSource<TEntity>,
) {
  query.value.number = pagination.current
  query.value.size = pagination.pageSize || 10
  fetchDataSource();
}

function activated() {
  if (options.value.skipActivatedOnce) {
    return;
  }
  fetchDataSource();
}

async function mounted() {
  if (props.pagination === undefined) {
    options.value.pagination = {hideOnSinglePage: true, placement: ['bottomCenter']}
  } else {
    options.value.pagination = props.pagination
  }
  if (props.immediate) {
    await fetchDataSource();
    options.value.skipActivatedOnce = false;
  }
}

watch(
  () =>
    [
      props.service,
      props.columns,
      props.actionItems,
      principalStore.state.grantedAuthorities,
    ] as const,
  () => rebuildAuthorityMeta(),
  {immediate: true, deep: true},
)

onActivated(activated)

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
    v-bind="$attrs"
    :row-key="SYSTEM_CONSTANT.ID_NAME"
    :data-source="dataSource"
    :loading="loading"
    @change="onChange"
    :bordered="props.bordered"
  >
    <template v-if="hasTitle" #title>
      <slot name="title"/>
    </template>
    <template #bodyCell="{ text, record, index, column}">
      <slot v-if="hasBodyCell" name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>
      <template v-if="column.dataIndex === 'action'">
        <l-action-button size="small" :action-items="props.renderActionItems(record, options.actionItems)" @action-item-click="(key) => handleActionClick(key, record)" />
      </template>
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
