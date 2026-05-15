<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TPage extends ScrollPageResult<TEntity>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import type {MenuTitleCardProps} from '@/components/basic/MenuTitleCard.vue'
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import type {AuthorityButtonProps} from '@/components/basic/AuthorityButton.vue'
import LAuthorityButton from '@/components/basic/AuthorityButton.vue'
import type {AuthorityOperateTableProps} from '@/components/basic/AuthorityOperateTable.vue'
import LAuthorityOperateTable from '@/components/basic/AuthorityOperateTable.vue'
import type {
  BasicCrudService,
  BasicIdMetadata,
  FindSearchService,
  PageSearchService,
  ScrollPageResult
} from '@/types'
import {computed} from 'vue'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'

/** 按钮区：`props` 透传至 AuthorityButton，`listeners` 经 toVueListeners 后 v-on */
export interface BasicCrudButtonZone {
  props?: Partial<AuthorityButtonProps> & Record<string, unknown>
  /** 如 `{ add: fn }` / `{ onAdd: fn }`，经 toVueListeners 转为 v-on */
  listeners?: Record<string, unknown>
}

/** 表格区：`props` 透传至 AuthorityOperateTable（不含 service，由本组件注入），`listeners` 同上 */
export interface BasicCrudTableZone<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  props?: Partial<Omit<AuthorityOperateTableProps<TBody, TEntity, TPage, TId>, 'service'>> & Record<string, unknown>
  listeners?: Record<string, unknown>
}

export interface BasicOperateTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: BasicCrudService<TBody, TEntity, TId> | FindSearchService<TEntity, TId> | PageSearchService<TEntity, TPage, TId>
  /** MenuTitleCard 与落在内部 a-card 上的 attrs（如 class、bodyStyle） */
  menuTitleCard?: Partial<MenuTitleCardProps> & Record<string, unknown>
  /** 按钮区：props + listeners */
  button?: BasicCrudButtonZone
  /** 表格区：props + listeners */
  table?: BasicCrudTableZone<TBody, TEntity, TPage, TId>
}

defineOptions({
  name: 'LBasicCurdTable',
})

const props = withDefaults(defineProps<BasicOperateTableProps<TBody, TEntity, TPage, TId>>(), {
  menuTitleCard: () => ({}),
  button: () => ({ props: {}, listeners: {} }),
  table: () => ({ props: {}, listeners: {} }),
})

/**
 * 将 `{ edit: fn }` 转为 `{ onEdit: fn }`；已是 `onEdit` / `onActionItemClick` 形式则原样保留。
 * 供子组件 `v-on` 使用。
 */
function toVueListeners(raw: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(raw)) {
    const val = raw[key]
    if (val == null) {
      continue
    }
    if (/^on[A-Z]/.test(key)) {
      out[key] = val
      continue
    }
    const head = key.charAt(0).toUpperCase()
    out[`on${head}${key.slice(1)}`] = val
  }
  return out
}

const tableListenersNormalized = computed(() => toVueListeners(props.table?.listeners))
const buttonListenersNormalized = computed(() => toVueListeners(props.button?.listeners))

/** service 与 table.props 合并 */
const authorityOperateTableBind = computed(
  (): AuthorityOperateTableProps<TBody, TEntity, TPage, TId> =>
    ({
      ...(props.table?.props ?? {}),
      service: props.service,
    }) as unknown as AuthorityOperateTableProps<TBody, TEntity, TPage, TId>,
)

/** props + listeners 合并进同一 v-bind（onXxx 与业务 props 同源，子组件能稳定收到监听） */
const authorityOperateTableMergedBind = computed(() => ({
  ...authorityOperateTableBind.value,
  ...tableListenersNormalized.value,
}))

const authorityButtonMergedBind = computed(() => ({
  ...(props.button?.props ?? {}),
  ...buttonListenersNormalized.value,
}))

</script>

<template>
  <div>
    <l-menu-title-card v-bind="props.menuTitleCard">
      <template #extra>
        <l-authority-button v-bind="authorityButtonMergedBind" />
      </template>
      <l-authority-operate-table v-bind="authorityOperateTableMergedBind">
        <template #bodyCell="slotProps">
          <slot name="tableBodyCell" v-bind="slotProps" />
        </template>
      </l-authority-operate-table>
    </l-menu-title-card>
  </div>
</template>
