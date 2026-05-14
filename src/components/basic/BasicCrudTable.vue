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

export interface BasicOperateTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: BasicCrudService<TBody, TEntity, TId> | FindSearchService<TEntity, TId> | PageSearchService<TEntity, TPage, TId>
  /** MenuTitleCard 与落在内部 a-card 上的 attrs（如 class、bodyStyle） */
  menuTitleCard?: Partial<MenuTitleCardProps> & Record<string, unknown>
  /** AuthorityButton */
  button?: Partial<AuthorityButtonProps> & Record<string, unknown>
  /** AuthorityOperateTable；不含 service，由本组件统一传入 */
  table?: Partial<Omit<AuthorityOperateTableProps<TBody, TEntity, TPage, TId>, 'service'>> & Record<string, unknown>
}

defineOptions({
  name: 'LBasicCurdTable',
})

const props = withDefaults(defineProps<BasicOperateTableProps<TBody, TEntity, TPage, TId>>(), {
  menuTitleCard: () => ({}),
  button: () => ({}),
  table: () => ({}),
})

/** service 与 table 透传合并；经 unknown 断言为完整 props，满足 v-bind 校验且避免 no-explicit-any */
const authorityOperateTableBind = computed(
  (): AuthorityOperateTableProps<TBody, TEntity, TPage, TId> =>
    ({
      ...props.table,
      service: props.service,
    }) as unknown as AuthorityOperateTableProps<TBody, TEntity, TPage, TId>,
)

</script>

<template>
  <div>
    <l-menu-title-card v-bind="props.menuTitleCard">
      <template #extra>
        <l-authority-button v-bind="props.button" />
      </template>
      <l-authority-operate-table v-bind="authorityOperateTableBind">
        <template #bodyCell="slotProps">
          <slot name="tableBodyCell" v-bind="slotProps" />
        </template>
      </l-authority-operate-table>
    </l-menu-title-card>
  </div>
</template>
