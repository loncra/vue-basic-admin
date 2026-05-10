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
import type {TableProps} from "antdv-next";

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

const slots = useSlots()

const props = withDefaults(
  defineProps<{
    service: BasicCrudService<TEntity>
    immediate?: boolean,
    pagination?: TableProps['pagination']
    columns: SearchableColumnType[]
  }>(),
  {
    immediate: true,
    columns: () => []
  },
)

const dataSource = defineModel<TEntity[]>('dataSource', {default: () => []})
const loading = defineModel('loading', {default: () => false})

const query = defineModel<FilterRequest | PageRequest>('query', {default: () => ({})})

const hasBodyCell = computed(() => Boolean(slots.bodyCell))

const options = ref<{
  columns: SearchableColumnType[]
  pagination?: TableProps['pagination']
}>({
  columns: [],
  pagination:{}
})

function search(
  column: SearchableColumnType,
  setSelectedKeys: (strings: string[]) => void,
  confirm: () => void
) {
  if (column.search && column.search.queryName) {
    const value = query.value[column.search.queryName] || ''
    setSelectedKeys(value ? [String(value)] : [])
  }
  confirm();
  fetchDataSource();
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

function rebuildSearchMeta() {
  options.value.columns = [];
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
}

async function fetchDataSource() {
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

function mounted() {
  if (props.immediate) {
    fetchDataSource();
  }
}

watch(
  () => props.columns,
  () => {
    rebuildSearchMeta()
  },
  {immediate: true, deep: true},
)

onMounted(mounted)

</script>

<template>
  <a-table :columns="options.columns" :pagination="options.pagination" v-bind="$attrs" :data-source="dataSource" :loading="loading" bordered>
    <template v-if="hasBodyCell" #bodyCell="{ text, record, index, column}">
      <slot name="bodyCell" :text="text" :record="record" :index="index" :column="column"/>
    </template>
    <template #filterIcon="{filtered}">
      <icon-font :class="'icon' + (filtered ? ' text-primary' : '')" type="icon-search"/>
    </template>
    <template #filterDropdown="{column, setSelectedKeys, confirm}">
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
