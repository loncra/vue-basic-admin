<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody = TBody, TId = TEntity['id']">
import {computed, ref, type Ref, useAttrs} from 'vue'
import {useRouter} from 'vue-router'
import type {BasicIdMetadata} from '@loncra/client/commons'
import LBasicForm from '@/components/basic/form/BasicForm.vue'
import i18n from '@/i18n'
import {buildFields, PAGE_VARIANT, usePageEnums} from './field'
import type {CrudPageDefinition, PageContext} from './types'

/**
 * 新增/编辑页渲染器：`page.form.fields` → a-row + a-form-item + 组件。
 * 页级生命周期（取 id、拉实体、提交、标题、陈旧检查、操作轨迹）仍由 BasicForm 负责。
 *
 * 逃生：
 * - 默认插槽（作用域里能拿到 `entity`）放 rowLayout 之外的整块内容；
 * - `contextExtra` 把壳自己的 ref / 查询条件交给声明里的钩子（`postGetEntity`、`preMounted`…）；
 * - `#beforeButton` / `#afterButton` 原样透传。
 */
defineOptions({
  name: 'LCrudFormPage',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    page: CrudPageDefinition<TBody, TEntity, TId>
    contextExtra?: Record<string, unknown>
    /** 宿主形态名：整页 `'page'`，别的宿主自己起名 */
    variant?: string
  }>(),
  {contextExtra: () => ({}), variant: PAGE_VARIANT},
)

const attrs = useAttrs()
const router = useRouter()

// 实体初值来自声明；BasicForm 随后会用服务端数据合并进来
const entity = ref(props.page.form?.createEntity?.() ?? ({} as TBody)) as unknown as Ref<TBody>
const spinning = ref(false)

const context = computed<PageContext>(() => ({
  router,
  t: (key: string, named?: Record<string, unknown>) => i18n.global.t(key, named as never),
  extra: props.contextExtra,
  variant: props.variant,
  entity: entity as unknown as Ref<Record<string, unknown>>,
}))

// enumId 优先取字段上的覆盖，其次取字段字典里的
const {buckets} = usePageEnums(
  (props.page.form?.fields ?? []).map((field) => field.enumId ?? props.page.fields?.[field.key]?.enumId),
)

const fields = computed(() =>
  buildFields(
    props.page.form?.fields ?? [],
    props.page.fields ?? {},
    props.page.i18nPrefix,
    buckets.value,
    context.value,
  ),
)

const titleText = computed(() => {
  const declared = props.page.form?.titleText
  return declared ? (title: string, value: TEntity | TBody) => declared(title, value, context.value) : undefined
})

const postGetEntity = computed(() => {
  const declared = props.page.form?.postGetEntity
  return declared ? (value: TEntity) => declared(value, context.value) : undefined
})

const preMounted = computed(() => {
  const declared = props.page.form?.preMounted
  return declared ? () => declared(context.value) : undefined
})

/** 壳（页面 SFC）需要拿到实体时用模板 ref 取：`pageRef.value.entity` */
defineExpose({entity})
</script>

<template>
  <l-basic-form
    :service="page.service"
    :operation-data-trace-target="page.operationDataTraceTarget as string"
    :redirect="{name: page.routes?.home}"
    :pre-mounted="preMounted"
    :post-mounted="page.form?.postMounted"
    :pre-submit="page.form?.preSubmit"
    :post-get-entity="postGetEntity"
    :title-text="titleText"
    v-model:entity="entity"
    v-model:spinning="spinning"
    v-bind="attrs"
  >
    <template #rowLayout>
      <a-col
        v-for="field of fields"
        :key="field.key"
        :xs="24"
        :sm="24"
        :md="field.span"
        :lg="field.span"
        :xl="field.span"
        :xxl="field.span"
      >
        <a-form-item :name="field.key" :label="field.label" :rules="field.rules">
          <component
            :is="() => field.render!({entity, t: context.t, variant: context.variant})"
            v-if="field.render"
          />
          <component
            :is="field.component"
            v-else
            v-model:value="entity[field.key]"
            v-bind="field.props"
          />
        </a-form-item>
      </a-col>
    </template>

    <slot :entity="entity" :extra="contextExtra" />

    <template v-if="$slots.beforeButton" #beforeButton>
      <slot name="beforeButton" />
    </template>
    <template v-if="$slots.afterButton" #afterButton>
      <slot name="afterButton" />
    </template>
  </l-basic-form>
</template>
