<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import type {
  BasicCrudService,
  BasicIdMetadata,
  FilterRequest,
  FlatSortMetadata,
  PageRequest,
  RestResult,
  ScrollPageResult,
} from '@/types/apis'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {App} from 'antdv-next'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, computed, getCurrentInstance, ref, useSlots} from 'vue'
import LActionButton from '@/components/basic/ActionButton.vue'
import LQueryCardGrid from '@/components/basic/QueryCardGrid.vue'
import type {
  ActionContext,
  ActionDefinition,
  ActionPayload,
  CrudCardGridProps,
} from '@/types/composables'
import {mergeDefinitions, resolveActions, useActionAuth} from '@/composables/action'

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

const emit = defineEmits<{
  action: [payload: ActionPayload<TEntity>]
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  drop: [sorts: FlatSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
}>()

const props = withDefaults(
  defineProps<CrudCardGridProps<TBody, TEntity, TPage, TId>>(),
  {
    recordActions: true,
    immediate: true,
    pagination: () => ({hideOnSinglePage: true}),
    dragDirection: 'horizontal',
    gridItemClass: 'w-1/5',
    selectable: true,
  },
)

const slots = useSlots()

function createDefaultBulkActions(): ActionDefinition<TEntity>[] {
  return [
    {
      id: 'deleteSelected',
      permission: props.authority?.delete,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      enabled: (ctx) =>
        ctx.selectedItems.length > 0 &&
        typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
      label: (ctx) =>
        globalProperties.$t('common.delete.selected', {count: ctx.selectedItems.length}),
      icon: () => createIcon('icon-delete'),
      run: (ctx) => remove(ctx.selectedItems),
    },
  ]
}

function createDefaultItemActions(): ActionDefinition<TEntity>[] {
  return [
    {
      id: 'edit',
      permission: props.authority?.edit,
      label: () => globalProperties.$t('common.edit', {name: ''}),
      icon: () => createIcon('icon-edit'),
      run: (ctx) => {
        if (ctx.record) {
          emit('edit', ctx.record)
        }
      },
    },
    {
      id: 'detail',
      permission: props.authority?.detail,
      label: () => globalProperties.$t('common.detail', {name: ''}),
      icon: () => createIcon('icon-order-inspection'),
      run: (ctx) => {
        if (ctx.record) {
          emit('detail', ctx.record)
        }
      },
    },
    {
      id: 'delete',
      permission: props.authority?.delete,
      enabled: () =>
        typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
      label: () => globalProperties.$t('common.delete.text'),
      icon: () => createIcon('icon-delete'),
      run: (ctx) => {
        if (ctx.record) {
          remove([ctx.record])
        }
      },
    },
  ]
}

const gridActions = computed(() =>
  mergeDefinitions(createDefaultBulkActions(), props.actions ?? []),
)

const itemActionDefinitions = computed(() =>
  mergeDefinitions(createDefaultItemActions(), props.itemActions ?? []),
)

function getToolbarActionContext(): ActionContext<TEntity> | undefined {
  const ctx = queryCardGrid.value?.actionContext
  if (!ctx) {
    return undefined
  }
  return 'value' in ctx ? (ctx.value as ActionContext<TEntity>) : (ctx as ActionContext<TEntity>)
}

function buildItemContext(record: TEntity): ActionContext<TEntity> {
  const toolbarCtx = getToolbarActionContext()
  return {
    scope: 'item',
    record,
    items: toolbarCtx?.items ?? [],
    selectedItems: toolbarCtx?.selectedItems ?? [],
    query: toolbarCtx?.query,
    extras: toolbarCtx?.extras ?? props.actionContextExtras ?? {},
  }
}

function resolveItemActions(record: TEntity) {
  return resolveActions(itemActionDefinitions.value, buildItemContext(record), auth)
}

function onItemAction(id: string, record: TEntity) {
  if (['edit', 'detail', 'delete'].includes(id)) {
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

function remove(records: TEntity[]) {
  if (records.length === 0) {
    return
  }
  const content =
    records.length === 1
      ? globalProperties.$t('common.delete.confirmSingle')
      : globalProperties.$t('common.delete.confirmBatch', {count: records.length})
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content,
    onOk: () => doDelete(records),
  })
}

async function doDelete(records: TEntity[]) {
  if (typeof (props.service as BasicCrudService<TBody, TEntity, TId>).delete !== 'function') {
    return
  }
  try {
    const result: RestResult<void> = await (
      props.service as BasicCrudService<TBody, TEntity, TId>
    ).delete(records.map((r) => r.id))
    message.success(result.message)
    await queryCardGrid.value?.fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
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
    :pagination="props.pagination"
    :immediate="props.immediate"
    v-bind="$attrs"
    v-model:loading="loading"
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
