<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onActivated,
  onMounted,
  provide,
  ref,
  useSlots,
} from 'vue'
import {App} from 'antdv-next'
import type {PaginationProps} from 'antdv-next/dist/pagination'
import type {
  BasicIdMetadata,
  FilterRequest,
  FlatSortMetadata,
  PageRequest,
  RestResult,
  ScrollPageResult,
} from '@/types/apis'
import type {
  ActionContext,
  ActionDefinition,
  ActionPayload,
  CardGridPagination,
  QueryCardGridProps,
} from '@/types/composables'
import {ACTION_CONTEXT_KEY} from '@/types/composables'
import {mergeDefinitions, resolveActions, useActionAuth} from '@/composables/action'
import {fetchCollectionData} from '@/composables/data/usePageDataFetch.ts'
import {useFlatDragDrop} from '@/composables'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import {useMenuPrincipalStore} from '@/stores/menuStore.ts'
import LActionButton from '@/components/basic/ActionButton.vue'

defineOptions({
  name: 'LQueryCardGrid',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const {message} = App.useApp()
const menuPrincipalStore = useMenuPrincipalStore()
const slots = useSlots()
const auth = useActionAuth()

const props = withDefaults(
  defineProps<Omit<QueryCardGridProps<TBody, TEntity, TPage, TId>, 'pagination'>>(),
  {
    hideTitle: false,
    immediate: true,
    dragDirection: 'horizontal',
    gridItemClass: 'w-1/5',
    selectable: true,
  },
)

const dataSource = defineModel<TEntity[]>('dataSource', {default: () => []})
const loading = defineModel<boolean>('loading', {default: () => false})
const query = defineModel<FilterRequest | PageRequest>('query', {default: () => ({})})
const selectedItems = defineModel<TEntity[]>('selectedItems', {default: () => []})
const pagination = defineModel<CardGridPagination>('pagination', {
  default: () => ({hideOnSinglePage: true, align: 'center'}),
})

const emit = defineEmits<{
  action: [payload: ActionPayload<TEntity>]
  drop: [sorts: FlatSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
}>()

const skipActivatedOnce = ref(true)

const dragEnabled = computed(() => !!props.drag)

const {
  onDragHandleStart,
  onDragHandleEnd,
  buildDropZoneProps,
  dropTargetClass,
} = useFlatDragDrop<TEntity, TId>({
  drag: dragEnabled,
  dataSource,
  direction: props.dragDirection,
  formatDragPreview: (record) =>
    props.formatDragPreview?.(record) ?? String(record[SYSTEM_CONSTANT.ID_NAME]),
  onFlatDrop: ({sorts, target, fromIndex, toIndex}) =>
    emit('drop', sorts, target, fromIndex, toIndex),
})

const actionContext = computed<ActionContext<TEntity>>(() => ({
  scope: 'toolbar',
  items: dataSource.value,
  selectedItems: selectedItems.value,
  query: query.value,
  extras: props.actionContextExtras ?? {},
}))

provide(ACTION_CONTEXT_KEY, actionContext as unknown as typeof actionContext)

function createDefaultToolbarActions(): ActionDefinition<TEntity>[] {
  return [
    {
      id: 'add',
      permission: props.authority?.add,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: () => globalProperties.$t('common.add', {name: ''}),
      icon: () => createIcon('icon-add'),
      run: (ctx) => emit('action', {id: 'add', context: ctx}),
    },
    {
      id: 'export',
      permission: props.authority?.export,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: (ctx) =>
        ctx.selectedItems.length > 0
          ? globalProperties.$t('common.export.selected', {count: ctx.selectedItems.length})
          : globalProperties.$t('common.export.all'),
      icon: () => createIcon('icon-goods-start-to-ship'),
      run: (ctx) => exportData(ctx.selectedItems),
    },
  ]
}

const titleActions = computed(() =>
  resolveActions(
    mergeDefinitions(createDefaultToolbarActions(), props.actions ?? []),
    actionContext.value,
    auth,
  ),
)

function isSelected(record: TEntity) {
  const id = record[SYSTEM_CONSTANT.ID_NAME]
  return selectedItems.value.some((item) => item[SYSTEM_CONSTANT.ID_NAME] === id)
}

function onSelect(record: TEntity) {
  if (!props.selectable) {
    return
  }
  if (isSelected(record)) {
    const id = record[SYSTEM_CONSTANT.ID_NAME]
    selectedItems.value = selectedItems.value.filter(
      (item) => item[SYSTEM_CONSTANT.ID_NAME] !== id,
    )
  } else {
    selectedItems.value = [...selectedItems.value, record]
  }
}

async function fetchDataSource() {
  try {
    loading.value = true
    dataSource.value = await fetchCollectionData({
      service: props.service,
      query: query.value,
      pagination,
    })
  } finally {
    loading.value = false
  }
}

async function exportData(records: TEntity[]) {
  let result: RestResult<void>
  if (records.length > 0) {
    const filter: FilterRequest = {}
    filter[`filter_[${SYSTEM_CONSTANT.ID_NAME}_in]`] = records.map((r) => r.id)
    result = await props.service.exportData(filter)
  } else {
    result = await props.service.exportData(query.value)
  }

  message.success(result.message)
  void globalProperties.$router.push({name: 'user_export'})
}

function onChangePage(page: number, pageSize: number) {
  query.value.number = page
  query.value.size = pageSize
  void fetchDataSource()
}

async function mounted() {
  if (props.immediate && skipActivatedOnce.value) {
    await fetchDataSource()
    skipActivatedOnce.value = false
  }
}

function activated() {
  if (skipActivatedOnce.value) {
    return
  }
  void fetchDataSource()
  skipActivatedOnce.value = true
}

onActivated(activated)
onMounted(mounted)

defineExpose({
  fetchDataSource,
  exportData,
  actionContext,
})

</script>

<template>
  <a-card size="small" v-bind="$attrs" :loading="loading">
    <template v-if="!props.hideTitle" #title>
      <a-flex justify="space-between" class="pr-xs pl-xs" align="center">
        <a-space v-if="!slots.title">
          <icon-font
            class="icon align"
            :type="menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.icon || 'icon-survey'"
          />
          <a-typography-text strong>
            {{ menuPrincipalStore.state.currentBreadcrumbs.at(-1)?.name || '' }}
          </a-typography-text>
        </a-space>
        <slot v-else name="title"/>
        <slot v-if="slots.extra" name="extra"/>
        <l-action-button v-else size="small" :actions="titleActions"/>
      </a-flex>
    </template>

    <slot v-if="(dataSource || []).length <= 0" name="empty">
      <a-empty/>
    </slot>

    <template v-else>
      <a-card-grid
        v-for="(record, index) of dataSource"
        :key="String(record[SYSTEM_CONSTANT.ID_NAME])"
        v-bind="buildDropZoneProps(record)"
        :class="[
          props.gridItemClass,
          isSelected(record) ? 'bg-info-bg' : '',
          dropTargetClass(record),
        ]"
        @click="onSelect(record)"
      >
        <slot
          name="item"
          :record="record"
          :index="index"
          :selected="isSelected(record)"
          :drag-enabled="dragEnabled"
          :on-drag-start="(event: DragEvent) => onDragHandleStart(record, event)"
          :on-drag-end="onDragHandleEnd"
        />
        <div v-if="slots.itemActions" @click.stop>
          <slot
            name="itemActions"
            :record="record"
            :index="index"
            :drag-enabled="dragEnabled"
            :on-drag-start="(event: DragEvent) => onDragHandleStart(record, event)"
            :on-drag-end="onDragHandleEnd"
          />
        </div>
      </a-card-grid>
    </template>

    <a-pagination
      v-if="pagination !== false"
      class="mt-md"
      v-bind="pagination as PaginationProps"
      @change="onChangePage"
    />
  </a-card>
</template>
