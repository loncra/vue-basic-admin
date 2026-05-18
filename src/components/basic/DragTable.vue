<script setup lang="ts"  generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">
import type {BasicIdMetadata, ScrollPageResult} from "@/types";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import LQueryTable, {
  type QueryTableProps,
  type SearchableColumnType
} from "@/components/basic/QueryTable.vue";
import type {TableProps} from "antdv-next";

export interface DragTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryTableProps<TBody, TEntity, TPage> {
  drag?:boolean
  formatDragPreview?: (record: TEntity) => string
  onRow?: TableProps['onRow']
}

defineOptions({
  name: 'LDragTable',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<DragTableProps<TBody, TEntity, TPage, TId>>(),
  {
  },
)

const columns = defineModel<SearchableColumnType[]>('columns', {default: () => []})

</script>

<template>
  <l-query-table :service="props.service" :columns="columns">

  </l-query-table>
</template>
