<script setup lang="ts" generic="TEntity extends BasicIdMetadata<any>">
import type {
  BasicCrudService,
  BasicIdMetadata,
} from '@/types'
import type {Component} from 'vue'
import {ref, watch} from 'vue'
import type {ColumnType} from "antdv-next/dist/table/interface";


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

const props = withDefaults(
  defineProps<{
    service: BasicCrudService<TEntity>
    immediate?: boolean
    columns: SearchableColumnType[]
  }>(),
  {
    immediate: true,
    columns: () => [],
  },
)

const dataSource = defineModel<TEntity[]>('dataSource', {default: () => []})
const loading = defineModel('loading', {default: () => false})

const query = defineModel<Record<string, unknown>>('query', {default: () => ({})})

const options = ref<{
  columns: SearchableColumnType[]
}>({
  columns: [],
})

function search(column:SearchableColumnType, confirm:() => void) {
  confirm();
  console.info(query.value);
}

function resetField(column:SearchableColumnType, clearFilters?: () => void) {
  clearFilters?.()
  if (column.search && column.search.queryName) {
    query.value[column.search.queryName] = '';
  }
}

function rebuildSearchMeta() {
  options.value.columns = [];
  const cols = props.columns ?? []
  for (const col of cols) {
    const optionsCol:SearchableColumnType = {...col};
    options.value.columns.push(optionsCol)
    if (!optionsCol.search || !optionsCol.search.component) {
      continue
    }
    optionsCol.filterDropdown = () => null;
    optionsCol.search.queryName = `filter_[${col.key}_${optionsCol.search.expression || 'eq'}]`
  }
}

watch(
  () => props.columns,
  () => {
    rebuildSearchMeta()
  },
  {immediate: true, deep: true},
)

</script>

<template>
  <a-table :columns="options.columns" v-bind="$attrs" :data-source="dataSource" :loading="loading" bordered>
    <template #filterIcon="{filtered}">
      <icon-font :class="'icon' + (filtered ? ' text-primary' : '')" type="icon-search"/>
    </template>
    <template #filterDropdown="{column, confirm, clearFilters}">
      <div class="p-md" @keydown.stop>
        <a-space orientation="vertical">
          <component
            :is="column.search.component"
            v-bind="column.search.props"
            v-model:value="query[column.search.queryName]"
          />
          <a-space-compact block>
            <a-button block type="primary" @click="search(column, confirm)">
              <template #icon>
                <icon-font class="icon align" type="icon-confirm"/>
              </template>
              <span>搜索</span>
            </a-button>
            <a-button block @click="resetField(column, clearFilters)">
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
