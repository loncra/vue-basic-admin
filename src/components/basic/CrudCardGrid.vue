<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import type {
  BasicIdMetadata,
  FilterRequest,
  FlatSortMetadata,
  PageRequest,
  ScrollPageResult,
} from '@/types/apis'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {App} from 'antdv-next'
import {requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, computed, getCurrentInstance, ref, useSlots} from 'vue'
import LActionButton from '@/components/basic/ActionButton.vue'
import LQueryCardGrid from '@/components/basic/QueryCardGrid.vue'
import type {
  ActionContext,
  ActionPayload,
  CardGridPagination,
  CrudCardGridProps,
} from '@/types/composables'
import {
  buildItemActionContext,
  BUILTIN_ITEM_ACTION_IDS,
  createDefaultBulkActions,
  createDefaultItemActions,
  mergeDefinitions,
  resolveActions,
  useActionAuth,
  useCrudDelete,
} from '@/composables/basic/action'

defineOptions({
  name: 'LCrudCardGrid',
})

const {message, modal} = App.useApp()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const auth = useActionAuth()

const queryCardGrid = ref<{
  fetchDataSource: () => Promise<void>
  exportData: (records: TEntity[]) => Promise<void>
  actionContext?: ActionContext<TEntity>
}>()

const loading = defineModel<boolean>('loading', {default: () => false})
const query = defineModel<FilterRequest | PageRequest>('query', {default: () => ({})})
const selectedItems = defineModel<TEntity[]>('selectedItems', {default: () => []})
const pagination = defineModel<CardGridPagination>('pagination', {
  default: () => ({hideOnSinglePage: true}),
})

const emit = defineEmits<{
  action: [payload: ActionPayload<TEntity>]
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  deleted: [records: TEntity[]]
  drop: [sorts: FlatSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
}>()

const props = withDefaults(
  defineProps<Omit<CrudCardGridProps<TBody, TEntity, TPage, TId>, 'pagination'>>(),
  {
    recordActions: true,
    immediate: true,
    dragDirection: 'horizontal',
    gridItemClass: 'w-1/5',
    selectable: true,
  },
)

const slots = useSlots();
const t = globalProperties.$t.bind(globalProperties)

const {remove} = useCrudDelete<TBody, TEntity, TId>({
  service: props.service,
  t,
  modal,
  message,
  loading,
  onDeleted: (records) => emit('deleted', records),
  refresh: () => queryCardGrid.value?.fetchDataSource(),
})

const gridActions = computed(() =>
  mergeDefinitions(
    createDefaultBulkActions<TBody, TEntity, TId>({
      authority: props.authority,
      service: props.service,
      t,
      remove,
    }),
    props.actions ?? [],
  ),
)

const itemActionDefinitions = computed(() =>
  mergeDefinitions(
    createDefaultItemActions<TBody, TEntity, TId>({
      authority: props.authority,
      service: props.service,
      t,
      remove,
      onEdit: (record) => emit('edit', record),
      onDetail: (record) => emit('detail', record),
    }),
    props.itemActions ?? [],
  ),
)

function buildItemContext(record: TEntity): ActionContext<TEntity> {
  return buildItemActionContext({
    record,
    toolbarContext: queryCardGrid.value?.actionContext,
    actionContextExtras: props.actionContextExtras,
  })
}

function resolveItemActions(record: TEntity) {
  return resolveActions(itemActionDefinitions.value, buildItemContext(record), auth)
}

function onItemAction(id: string, record: TEntity) {
  if (BUILTIN_ITEM_ACTION_IDS.includes(id as (typeof BUILTIN_ITEM_ACTION_IDS)[number])) {
    return
  }
  emit('action', {id, context: buildItemContext(record)})
}

function onGridAction(payload: ActionPayload<TEntity>) {
  if (payload.id === 'add') {
    emit('add')
  }
  emit('action', payload)
}

function fetchDataSource() {
  return queryCardGrid.value?.fetchDataSource()
}

function exportData() {
  return queryCardGrid.value?.exportData(selectedItems.value)
}

defineExpose({
  fetchDataSource,
  exportData,
  remove,
})

</script>

<template>
  <l-query-card-grid
    ref="queryCardGrid"
    :hide-title="props.hideTitle"
    :actions="gridActions"
    :action-context-extras="props.actionContextExtras"
    :drag="props.drag"
    :format-drag-preview="props.formatDragPreview"
    :drag-direction="props.dragDirection"
    :grid-item-class="props.gridItemClass"
    :selectable="props.selectable"
    :authority="props.authority"
    :service="props.service"
    :immediate="props.immediate"
    v-bind="$attrs"
    v-model:loading="loading"
    v-model:pagination="pagination"
    v-model:query="query"
    v-model:selected-items="selectedItems"
    @action="onGridAction"
    @drop="(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)"
  >
    <template #title v-if="slots.title">
      <slot name="title"/>
    </template>
    <template #empty v-if="slots.empty">
      <slot name="empty"/>
    </template>
    <template #extra v-if="slots.extra">
      <slot name="extra"/>
    </template>
    <template #item="itemSlot">
      <slot
        v-if="slots.item"
        name="item"
        v-bind="itemSlot"
        :item-actions="props.recordActions ? resolveItemActions(itemSlot.record as TEntity) : []"
      />
      <template v-else-if="props.recordActions">
        <slot
          name="itemActions"
          :record="itemSlot.record"
          :index="itemSlot.index"
          :drag-enabled="itemSlot.dragEnabled"
          :on-drag-start="itemSlot.onDragStart"
          :on-drag-end="itemSlot.onDragEnd"
          :actions="resolveItemActions(itemSlot.record as TEntity)"
        >
          <a-card size="small" :title="String((itemSlot.record as TEntity)[SYSTEM_CONSTANT.ID_NAME])">
            <template #actions>
              <l-action-button
                size="small"
                type="text"
                always-dropdown
                :actions="resolveItemActions(itemSlot.record as TEntity)"
                @click.stop
                @action="(id) => onItemAction(id, itemSlot.record as TEntity)"
              />
              <div
                v-if="itemSlot.dragEnabled"
                class="text-center cursor-grab"
                draggable="true"
                @click.stop
                @dragstart="itemSlot.onDragStart($event)"
                @dragend="itemSlot.onDragEnd"
              >
                <a-typography-text type="secondary">
                  ::
                </a-typography-text>
              </div>
            </template>
          </a-card>
        </slot>
      </template>
    </template>
    <template v-if="slots.itemActions" #itemActions="itemActionsSlot">
      <slot name="itemActions" v-bind="itemActionsSlot"/>
    </template>
  </l-query-card-grid>
</template>
