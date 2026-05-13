<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">
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
  TableAuthorityProps,
  TotalPage,
} from '@/types'
import {
  onActivated,
  type Component,
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  useSlots,
  watch
} from 'vue'
import type {ColumnType} from "antdv-next/dist/table/interface";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {MenuProps, TableProps} from "antdv-next";
import {App} from 'antdv-next'
import {usePrincipalStore} from '@/stores/principalStore'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import type {MenuInfo} from '@v-c/menu'

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

export interface AuthorityOperateTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: BasicCrudService<TBody, TEntity>
  immediate?: boolean
  enabledActions?: boolean
  pagination?: TableProps['pagination']
  columns: SearchableColumnType[]
  authority?: TableAuthorityProps
  actionItems?: NonNullable<MenuProps['items']>
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
  defineProps<AuthorityOperateTableProps<TBody, TEntity, TId>>(),
  {
    immediate: true,
    columns: () => [],
    enabledActions: true,
    actionItems: () => [],
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

const hasBodyCell = computed(() => Boolean(slots.bodyCell))

const options = ref<{
  columns: SearchableColumnType[]
  pagination?: TableProps['pagination']
  actionItems: NonNullable<MenuProps['items']>
}>({
  columns: [],
  pagination: {},
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
    optionsCol.search.queryName = `filter_[${col.key}_${optionsCol.search.expression || 'eq'}]`
  }

  if (props.enabledActions && principalStore.hasAnyPermission([props.authority?.edit || '', props.authority?.detail || '', props.authority?.delete || ''])) {
    options.value.columns.push({
      title: globalProperties.$t('common.operation'),
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      width: 80,
      fixed: 'right'
    })
    const actionItems = [];
    if (principalStore.hasAnyPermission([props.authority?.edit || '', props.authority?.detail || ''])) {
      actionItems.push({
        key: 'edit',
        label: globalProperties.$t('common.edit'),
        icon: () => createIcon('icon-edit'),
      })
    }
    if (principalStore.hasPermission(props.authority?.detail || '')) {
      actionItems.push({
        key: 'detail',
        label: globalProperties.$t('common.detail'),
        icon: () => createIcon('icon-order-inspection'),
      })
    }
    if (principalStore.hasPermission(props.authority?.delete || '')) {
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
    options.value.pagination = false;
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
      ? globalProperties.$t('common.deleteConfirmSingle')
      : globalProperties.$t('common.deleteConfirmBatch', {count: records.length})
  modal.confirm({
    title: globalProperties.$t('common.deleteConfirmTitle'),
    content,
    onOk: () => doDelete(records),
  })
}

async function doDelete(records: TEntity[]) {
  try {
    const result:RestResult<void> = await props.service.delete(records.map(r => r.id))
    message.success(result.message)
    fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false;
  }
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

function activated() {
  if (props.immediate) {
    fetchDataSource();
  }
}

function mounted() {
  options.value.pagination = props.pagination === false ? false : { ...(props.pagination || {})};
  activated()
}

watch(
  () =>
    [
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
    bordered
  >
    <template #bodyCell="{ text, record, index, column}">
      <slot v-if="hasBodyCell" name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>
      <template v-if="column.dataIndex === 'action'">
        <a-dropdown
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
    <template #filterIcon="{filtered}">
      <icon-font :class="'icon' + (filtered ? ' text-primary' : '')" type="icon-search"/>
    </template>
    <template #filterDropdown="{column, setSelectedKeys, confirm}" >
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
              <span>{{ globalProperties.$t('search.text') }}</span>
            </a-button>
            <a-button block @click="resetField(column, setSelectedKeys, confirm)">
              <template #icon>
                <icon-font class="icon align" type="icon-error"/>
              </template>
              <span>{{ globalProperties.$t('common.reset') }}</span>
            </a-button>
          </a-space-compact>
        </a-space>
      </div>
    </template>
  </a-table>
</template>
