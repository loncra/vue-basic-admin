<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LQueryTable, {
  type QueryTableProps,
  type SearchableColumnType
} from "@/components/basic/QueryTable.vue";
import type {BasicCrudService, BasicIdMetadata, RestResult, ScrollPageResult} from "@/types/apis";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import {App, type MenuProps} from "antdv-next";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref, watch} from "vue";
import LActionButton from "@/components/basic/ActionButton.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";

export interface CurdTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryTableProps<TBody, TEntity, TPage>{
  enabledActions?: boolean
  actionButtons?: NonNullable<MenuProps['items']>
  renderActionItems?: (record: TEntity, actionItems: NonNullable<MenuProps['items']>) => NonNullable<MenuProps['items']>
}

defineOptions({
  name: 'LCrudTable',
  inheritAttrs: false,
})

const { message, modal } = App.useApp()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const actionItemsRef = ref<NonNullable<MenuProps['items']>>([])
const queryTable = ref();

const loading = defineModel<boolean>('loading', {default: () => false})
const columns = defineModel<SearchableColumnType[]>('columns', {default: () => []})

const emit = defineEmits<{
  add:[]
  edit: [record: TEntity]
  detail: [record: TEntity]
  actionItemClick: [e:string, record: TEntity]
}>()

const props = withDefaults(
  defineProps<CurdTableProps<TBody, TEntity, TPage, TId>>(),
  {
    renderActionItems: (record: TEntity, actionItems: NonNullable<MenuProps['items']>) => actionItems
  },
)

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
    await queryTable.value.fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false;
  }
}

function rebuildActionItems() {
  actionItemsRef.value = [];
  if (props.enabledActions) {

    if (principalStore.hasPermission(props.authority?.edit as string) || props.authority?.edit) {
      actionItemsRef.value.push({
        key: 'edit',
        label: globalProperties.$t('common.edit',{name:''}),
        icon: () => createIcon('icon-edit'),
      })
    }
    if (principalStore.hasPermission(props.authority?.detail as string) || props.authority?.detail) {
      actionItemsRef.value.push({
        key: 'detail',
        label: globalProperties.$t('common.detail',{name:''}),
        icon: () => createIcon('icon-order-inspection'),
      })
    }
    if ((principalStore.hasPermission(props.authority?.delete as string) || props.authority?.delete) && typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function') {
      actionItemsRef.value.push({
        key: 'delete',
        label: globalProperties.$t('common.delete'),
        icon: () => createIcon('icon-delete'),
      })
    }

  }

  if (actionItemsRef.value.length > 0) {
    columns.value.push({
      title: globalProperties.$t('common.action'),
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      width: 80,
      fixed: 'right'
    })
  }
}

watch(
  () =>
    [
      props.enabledActions,
      props.actionButtons,
    ] as const,
  () => rebuildActionItems(),
  {immediate: true, deep: true},
)


</script>

<template>
  <l-query-table ref="queryTable" :columns="columns" v-bind="$attrs" :service="props.service" v-model:loading="loading">
    <template #bodyCell="{ record, column}">
      <template v-if="column.dataIndex === 'action'">
        <l-action-button size="small" :action-items="props.renderActionItems(record, actionItemsRef)" @action-item-click="(key) => handleActionClick(key, record)" />
      </template>
    </template>
  </l-query-table>
</template>
