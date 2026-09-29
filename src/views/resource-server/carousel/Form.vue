<script setup lang="ts">
import {computed, ref} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import type {CarouselSavePayload} from '@/types/apis'
import {CrudFormPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {SYSTEM_CONSTANT} from '@/constants'
import {carouselCore} from './carousel.page'
import {carouselFormPage} from './carousel.form.page'

/**
 * 轮播图新增/编辑页薄壳：字段、校验、初值、枚举来源、封面上传、日期转换
 * 以及 `preMounted` / `postGetEntity` / `preSubmit` 都在声明（`carousel.form.page.ts` / `carousel.page.ts`）。
 *
 * 这里只剩：主键与标题、离场、`?type=` 初值，外加**字段行之后的两块**（旧页面它们就在
 * `#rowLayout` 之外）：`link`（协议 + 地址的组合控件，校验名是嵌套路径 `['link','value']`）
 * 与 `remark` —— 留在插槽里顺序才与旧页面一致。
 */
defineOptions({
  name: 'ResourceServerCarouseForm',
})

const {t} = useI18n()
const route = useRoute()
const formRef = ref<{entity?: CarouselSavePayload}>()

/** 主键：进页面那一刻取一次（快照）；新增态没有 id ⇒ pro 不取数 */
const id = route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined
/** 旧 `preMounted` 里那段 `?type=` 初值覆盖（声明侧读不到路由 ⇒ 从这里递进去） */
const initialType = route.query.type as string | undefined

/** 链接协议（旧页面那个 `linkOptions`；`applet://` 那个名字要翻） */
const linkOptions = computed(() => [
  {name: 'http://', value: 'http://'},
  {name: 'https://', value: 'https://'},
  {name: t('common.applet'), value: 'applet://'},
])

/** 标题：旧 `title-text` 是 `标题 (名称)`，新增态只给基标题 */
useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  return entity?.id ? entity.name : undefined
})

/** 保存成功后的去向（旧页面 `:redirect="{name: RESOURCE_SERVER_CAROUSEL_ROUTE.HOME}"`） */
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: carouselCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="carouselFormPage"
    :context-extra="{initialType}"
    @success="onSuccess"
    @stale="onStale"
  >
    <!-- 字段行之后（旧页面同一顺序） -->
    <template #default="{entity}">
      <a-form-item
        :label="$t('common.link')"
        :name="['link', 'value']"
        :rules="[{required: true, trigger: 'change'}]"
      >
        <a-space-compact block>
          <a-select v-model:value="entity.link.id" style="width: 120px" :options="linkOptions" />
          <a-input v-model:value="entity.link.value" />
        </a-space-compact>
      </a-form-item>

      <a-form-item :label="$t('common.remark')" name="remark">
        <a-textarea v-model:value="entity.remark" :auto-size="{minRows: 5, maxRows: 10}" />
      </a-form-item>
    </template>
  </crud-form-page>
</template>
