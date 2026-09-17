<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody = TBody, TId = TEntity['id']">
import {computed, ref, type Ref, useAttrs} from 'vue'
import {useRouter} from 'vue-router'
import type {BasicIdMetadata} from '@loncra/client/commons'
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import i18n from '@/i18n'
import {buildDetailItems, PAGE_VARIANT} from './field'
import type {CrudDetailDefinition, PageContext} from './types'

/**
 * 详情页渲染器：`page.detail.fields` → a-descriptions 的 items。
 * 页级生命周期（取 id、拉实体、标题、陈旧检查、操作轨迹）仍由 BasicDetail 负责。
 *
 * 逃生：`contextExtra`（子表 ref 等）＋ `#extra` / `#afterDescriptions` / `#afterOperationDataTrace`
 * 原样透传（挂附表、资源树这类"声明管不到"的内容）。
 */
defineOptions({
  name: 'LCrudDetailPage',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    page: CrudDetailDefinition<TBody, TEntity, TId>
    contextExtra?: Record<string, unknown>
    /** 宿主形态名：整页 `'page'`，别的宿主自己起名 */
    variant?: string
  }>(),
  {contextExtra: () => ({}), variant: PAGE_VARIANT},
)

/** 详情展示的响应式列数：省略时用现在的通用默认值 */
const DEFAULT_COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

const attrs = useAttrs()
const router = useRouter()

const entity = ref({} as TEntity) as unknown as Ref<TEntity>

const context = computed<PageContext>(() => ({
  router,
  t: (key: string, named?: Record<string, unknown>) => i18n.global.t(key, named as never),
  extra: props.contextExtra,
  variant: props.variant,
  entity: entity as never,
}))

const items = computed(() =>
  buildDetailItems(
    props.page.detail?.fields ?? [],
    props.page.fields ?? {},
    entity.value,
    props.page.i18nPrefix,
  ),
)

const titleText = computed(() => {
  const declared = props.page.detail?.titleText
  return declared ? (title: string, value: TEntity) => declared(title, value, context.value) : undefined
})

const postGetEntity = computed(() => {
  const declared = props.page.detail?.postGetEntity
  return declared ? (value: TEntity) => declared(value, context.value) : undefined
})

/** 壳（页面 SFC）需要拿到实体时用模板 ref 取：`pageRef.value.entity` */
defineExpose({entity})
</script>

<template>
  <l-basic-detail
    :service="page.detailService ?? page.service"
    :operation-data-trace-target="page.operationDataTraceTarget as string"
    :redirect="{name: page.routes?.home}"
    :post-get-entity="postGetEntity"
    :title-text="titleText"
    :items="items"
    :column="page.detail?.column ?? DEFAULT_COLUMN"
    v-model:entity="entity"
    v-bind="attrs"
  >
    <template v-if="$slots.extra" #extra>
      <slot name="extra" />
    </template>
    <template v-if="$slots.afterDescriptions" #afterDescriptions>
      <slot name="afterDescriptions" :entity="entity" :extra="contextExtra" />
    </template>
    <template v-if="$slots.afterOperationDataTrace" #afterOperationDataTrace>
      <slot name="afterOperationDataTrace" />
    </template>
  </l-basic-detail>
</template>
