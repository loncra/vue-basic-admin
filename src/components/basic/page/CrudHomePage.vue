<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody = TBody, TId = TEntity['id']">
import {
  computed,
  createTextVNode,
  createVNode,
  Fragment,
  isVNode,
  ref,
  type Ref,
  toDisplayString,
  useAttrs,
  type VNode,
} from 'vue'
import {useRouter} from 'vue-router'
import {CrudTable as LCrudTable} from '@loncra/antdv-pro'
import type {BasicIdMetadata} from '@loncra/client/commons'
import i18n from '@/i18n'
import {buildColumns, PAGE_VARIANT, renderCell, usePageEnums} from './field'
import type {CrudHomeDefinition, PageContext, PageListEntry} from './types'

/**
 * 列表页渲染器：把 `page.list` 的声明翻成 CrudTable 的 props。
 * 不做路由（路由在 src/routers），不写业务逻辑，只做"填空"。
 *
 * 逃生：
 * - `$attrs` 直通 CrudTable（hide-title / record-actions / query / row-selection / scroll …）；
 * - 拿到的 `ctx.variant` 是**宿主命名的形态**（整页 `'page'`，内嵌宿主自己起名如 `'picker'`），
 *   列用 `visible`、动作用函数形态按形态裁剪；
 * - 页面自己的 `#title` / `#bodyCell` / `#expandedRowRender` 优先。
 */
defineOptions({
  name: 'LCrudHomePage',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    page: CrudHomeDefinition<TBody, TEntity, TId>
    /** 宿主形态名：整页 `'page'`，内嵌宿主自己起（如 `'picker'`） */
    variant?: string
  }>(),
  {variant: PAGE_VARIANT},
)

const attrs = useAttrs()
const router = useRouter()
const tableRef = ref<InstanceType<typeof LCrudTable>>()

/**
 * 宿主拿它按新的查询条件重刷（如 role 表单里的资源选择器跟着 sources 变）；
 * `clearDataSource` 用于"条件不成立时干脆不查、留空"（同旧 ResourceTable 的语义）。
 */
const dataSource = ref([]) as Ref<TEntity[]>

defineExpose({
  fetchDataSource: () => tableRef.value?.fetchDataSource(),
  clearDataSource: () => {
    dataSource.value = []
  },
  /** 当前表格数据（宿主做树形选择时需要按树找祖先 / 子节点） */
  dataSource,
})

const context = computed<PageContext>(() => ({
  router,
  t: (key: string, named?: Record<string, unknown>) => i18n.global.t(key, named as never),
  extra: {},
  variant: props.variant,
}))

const {buckets} = usePageEnums(props.page.list?.enums)

const columnDefs = computed<PageListEntry<TEntity>[]>(() => props.page.list?.columns ?? [])

const columns = computed(() =>
  buildColumns(columnDefs.value, props.page.fields ?? {}, props.page.i18nPrefix, buckets.value, context.value),
)

/**
 * 单元格内容，统一收敛成 VNode 交给 `<component :is>`：
 * - 声明里认领的列（`render` / `format`）用 renderCell 的结果；
 * - 不认领的列用表格给的 `text` —— 它可能是**渲染好的 VNode**（选择列是 Checkbox、
 *   内部列自带 render），所以禁止拿去 `{{ }}` 插值：VNode 进 toDisplayString 会
 *   JSON.stringify 到「component ↔ vnode」环形引用直接报错。
 */
function cellContent(slotProps: {
  column: {key?: string | number}
  text: unknown
  record: TEntity
}): VNode {
  const declared = renderCell(columnDefs.value, props.page.fields ?? {}, slotProps.column?.key, slotProps.record)
  return toCellVNode(declared === undefined ? slotProps.text : declared)
}

function toCellVNode(content: unknown): VNode {
  if (isVNode(content)) {
    return content
  }
  if (Array.isArray(content) && content.every((item) => isVNode(item))) {
    return createVNode(Fragment, null, content)
  }
  return createTextVNode(toDisplayString(content))
}

const rowActions = computed(() => {
  const declared = props.page.list?.rowActions
  if (!declared) {
    return []
  }
  return typeof declared === 'function' ? declared(context.value) : declared
})

function go(name?: string, record?: TEntity) {
  if (!name) {
    return
  }
  void router.push({name, query: record ? {id: String(record.id)} : undefined})
}
</script>

<template>
  <l-crud-table
    ref="tableRef"
    :service="page.service"
    :columns="columns"
    :drag="page.list?.drag"
    :format-drag-preview="page.list?.formatDragPreview"
    v-model:data-source="dataSource"
    :authority="page.list?.authority"
    :row-actions="rowActions"
    :row-key="page.rowKey"
    :row-selection="page.list?.rowSelection"
    @add="go(page.routes?.add)"
    @edit="(record: TEntity) => go(page.routes?.edit, record)"
    @detail="(record: TEntity) => go(page.routes?.detail, record)"
    v-bind="attrs"
  >
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <!-- 注意：只能用 <template #bodyCell>。`v-slots="对象"` 会被 Vue 编译成自定义指令
         （resolveDirective("slots")），插槽根本传不下去。 -->
    <template #bodyCell="slotProps">
      <slot v-if="$slots.bodyCell" name="bodyCell" v-bind="slotProps" />
      <component v-else :is="cellContent(slotProps)" />
    </template>
    <template v-if="$slots.expandedRowRender" #expandedRowRender="slotProps">
      <slot name="expandedRowRender" v-bind="slotProps" />
    </template>
  </l-crud-table>
</template>
