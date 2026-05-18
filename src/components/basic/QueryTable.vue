<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import {
  type Component,
  type ComponentInternalInstance,
  getCurrentInstance,
  onActivated,
  onMounted,
  ref,
  useSlots,
  watch
} from "vue";
import type {ColumnType} from "antdv-next/dist/table/interface";
import {App, type MenuProps, type TableProps} from "antdv-next";
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
  TotalPage
} from "@/types/apis";
import type {TableAuthorityProps} from "@/types/composables";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import type {PageSearchRestfulService} from "@/apis/pageSearchRestfulService.ts";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import LActionButton from "@/components/basic/ActionButton.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";

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

export interface QueryTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: FindSearchService<TEntity, TId> | PageSearchService<TEntity, TPage, TId> | BasicCrudService<TBody, TEntity, TId>
  immediate?: boolean
  bordered?: boolean
  authority?: TableAuthorityProps
  hideTitle?: boolean
  columns:SearchableColumnType[]
  titleButtons?: NonNullable<MenuProps['items']>
}

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

const props = withDefaults(
  defineProps<QueryTableProps<TBody, TEntity, TPage, TId>>(),
  {
    hideTitle:false,
    bordered:true,
    immediate: true,
    columns: () => [],
  },
)
const dataSource = defineModel<TEntity[]>('dataSource', {default: () => []})
const loading = defineModel<boolean>('loading', {default: () => false})

const query = defineModel<FilterRequest | PageRequest>('query', {default: () => ({})})
const pagination = defineModel<TableProps['pagination']>('pagination', {default: () => undefined})

const options = ref<{
  skipActivatedOnce:boolean
  titleButtons:NonNullable<MenuProps['items']>
  columns:SearchableColumnType[]
}>({
  skipActivatedOnce:true,
  titleButtons:[],
  columns:[]
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

function rebuild() {
  options.value.columns = []
  options.value.titleButtons = []
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

  if (principalStore.hasPermission(props.authority?.export as string) || props.authority?.export) {
    options.value.titleButtons.push({
      key: 'export',
      label: globalProperties.$t('common.export'),
      icon: () => createIcon('icon-goods-start-to-ship', 'align'),
    })
  }

  if (principalStore.hasPermission(props.authority?.add as string) || props.authority?.add) {
    options.value.titleButtons.push({
      key: 'add',
      label: globalProperties.$t('common.add',{name:''}),
      icon: () => createIcon('icon-add', 'align'),
    })
  }

  options.value.titleButtons.push(...props.titleButtons || [])
}

async function fetchDataSource() {
  try {
    loading.value = true;
    const data:TEntity[] = [];
    if (typeof (props.service as PageSearchService<TEntity, TPage, TId>).page === 'function') {
      const result:RestResult<TPage> = await (props.service as PageSearchRestfulService<TEntity, TPage, TId>).page(query.value as PageRequest);
      data.push(...(result.data?.elements || []))
      if (pagination.value) {

        pagination.value.pageSize = result.data?.size || 10 ;

        const pageResult = result.data as unknown as PageResult<TEntity>
        if (pageResult.number) {
          pagination.value.current = pageResult.number;
          const n =
            typeof pageResult.number === 'number' && Number.isFinite(pageResult.number)
              ? pageResult.number
              : ((query.value as PageRequest).number ?? 1)
          const rowCount = data.length
          if (pageResult.last) {
            pagination.value.total = (n - 1) * pageResult.size + rowCount
          } else {
            pagination.value.total = n * pageResult.size + 1
          }
        }

        const totalPage = result.data as unknown as TotalPage<TEntity>
        if (totalPage.totalCount) {
          pagination.value.total = totalPage.totalCount;
        }
      }

    } else if (typeof (props.service as FindSearchService<TEntity, TId>).find === 'function') {
      const result:RestResult<TEntity[]> = await (props.service as FindSearchService<TEntity, TId>).find(query.value as FilterRequest);
      data.push(...(result.data || []))
      if (pagination.value === undefined) {
        pagination.value = false;
      }
    }

    dataSource.value = data;
  } finally {
    loading.value = false;
  }
}

async function exportData(records: TEntity[]) {
  let result:RestResult<void>;
  if (records.length === 0) {
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
  if (pagination.value === undefined) {
    pagination.value = {hideOnSinglePage: true, placement: ['bottomCenter']}
  }
  if (props.immediate && options.value.skipActivatedOnce) {
    await fetchDataSource();
    options.value.skipActivatedOnce = false;
  }
}

function activated() {
  if (options.value.skipActivatedOnce) {
    return;
  }
  fetchDataSource();
  options.value.skipActivatedOnce = true;
}

watch(
  () =>
    [
      props.service,
      props.columns,
    ] as const,
  () => rebuild(),
  {immediate: true, deep: true},
)

onActivated(activated)

onMounted(mounted)

defineExpose({
  fetchDataSource,
  exportData
})

</script>

<template>
  <a-table
    :columns="columns"
    :pagination="pagination"
    v-bind="$attrs"
    :row-key="SYSTEM_CONSTANT.ID_NAME"
    :data-source="dataSource"
    :loading="loading"
    :bordered="props.bordered"
  >
    <template #title v-if="!hideTitle">
      <template v-if="slots.title" >
        <slot name="title"/>
      </template>
      <template v-else>
        <a-flex justify="space-between" align="center">
          <a-space>
            <icon-font class="icon align" :type="menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.icon || 'icon-survey'"/>
            <span>{{ menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.name || '' }}</span>
          </a-space>
          <l-action-button :action-items="options.titleButtons"/>
        </a-flex>
      </template>
    </template>
    <template #bodyCell="{ text, record, index, column}">
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
