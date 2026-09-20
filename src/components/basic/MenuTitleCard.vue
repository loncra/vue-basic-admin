<script setup lang="ts">
import {computed, useAttrs} from 'vue'
import {DataLoadingCardPlan as LDataLoadingCardPlan} from '@loncra/antdv-pro'

defineOptions({
  name: 'LMenuTitleCard',
})

/**
 * 页面壳（薄壳）：只留对外的 `hideTitle`，其余全交给 `@loncra/antdv-pro` 的 `DataLoadingCardPlan`。
 *
 * - 默认标题（面包屑）走 `CrudConfig.resolveDefaultTitle` —— 就是本组件原来读的那个 store，
 *   在 `App.vue` 里注入，同一份数据；
 * - `$attrs`（`loading` / `classes` / `tab-list` / `active-tab-key` / `@tab-change` …）原样给 Card；
 * - `#title` / `#extra` / 默认插槽原样转发。
 */
const props = withDefaults(
  defineProps<{
    hideTitle?: boolean
  }>(),
  {
    hideTitle: false,
  },
)

const attrs = useAttrs()
/** `hideTitle` 只是 "不要标题" 的一种说法：表达成 `title={false}`；不给就按声明走（含页面自给的 title） */
const shellAttrs = computed(() => (props.hideTitle ? {...attrs, title: false} : attrs))
</script>

<template>
  <l-data-loading-card-plan v-bind="shellAttrs">
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template #extra>
      <slot name="extra" />
    </template>
    <slot />
  </l-data-loading-card-plan>
</template>
