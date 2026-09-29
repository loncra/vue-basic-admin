<script setup lang="ts">
import {computed, inject, ref} from 'vue'
import {useRoute} from 'vue-router'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {ModelGenerateOptions, ModelSettingSavePayload} from '@loncra/client/ai'
import {CrudFormPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {
  AI_SERVER_MODEL_SETTING_ROUTE,
  LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_GENERATE_OPTION_NUMBER_KEYS,
  MODEL_GENERATE_OPTION_STRING_KEYS,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  SYSTEM_CONSTANT,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {modelSettingFormPage} from './model-setting.form.page'

/**
 * 模型设置新增/编辑页薄壳：字段、校验、初值、厂商字典与 400、默认参数的摊平/清洗都在声明
 * （`model-setting.form.page.ts` / `model-setting.page.ts`）；这里只剩四件宿主的事 ——
 * 主键（pro 不认路由）、标题、离场，外加「默认参数」那个 `a-collapse`（字段行之后的宿主编排）。
 */
defineOptions({
  name: 'AiServerModelSettingForm',
})

const route = useRoute()
/** 壳要读 expose 的 `buckets`（是/否下拉的选项来自声明统一加载的那份桶）⇒ 本地类型带上它 */
const formRef = ref<{entity?: ModelSettingSavePayload; buckets?: EnumBucketsResponseBody}>()

/** 关 tab 要递给声明的 `preMounted`（厂商 code 缺失/查不到 → 400 那条路），声明里拿不到 inject */
const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
  LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
)

/** 主键：**进页面那一刻取一次**（快照），别写 computed（缓存实例被重激活会拿别人的 id） */
const id = route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined

/**
 * 标题（旧 `title-text`）：编辑态 `标题 (实体名)`；新增态 `标题 (厂商名)`（厂商由 `preMounted` 灌进来）。
 * ⚠️ 厂商 code 是**字符串** ⇒ 不能用 `useRequiredQuery`（它会把参数 `Number()`，`'openai'` 会变 NaN
 * 被当成"没给"），所以那条 400 校验留在声明的 `preMounted` 里。
 */
useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  if (!entity) {
    return undefined
  }
  return entity.id ? entity.name : entity.manufacturer?.name
})

/** 保存成功后的去向；回列表要**带上厂商 code**（列表左侧树靠它选中厂商） */
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: () => {
    const code = formRef.value?.entity?.manufacturer?.code
    return {
      name: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
      query: code ? {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: code} : {},
    }
  },
  entity: () => formRef.value?.entity,
})

/**
 * 是/否枚举：默认参数里的布尔项，界面上是「是/否」下拉。
 *
 * 这份桶由**声明**统一加载（核心字典里 `enabled` 的 `enumRef: YES_OR_NO`）⇒ 壳从
 * `CrudFormPageExpose.buckets` 读**同一份**结果，不再自己发一次同样的请求（那段 `onMounted` 也就没了）。
 */
const yesOrNoOptions = computed(
  () =>
    (formRef.value?.buckets?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
      SYSTEM_ENUM_TYPE.YES_OR_NO
    ] ?? []) as NameValueEnumMetadata<number>[],
)

/**
 * 「默认参数」的绑定对象：实体上的 `metadata.默认参数`（旧页面 `generateOptions` 的 getter）。
 * 插槽作用域给的是 client 实体 ⇒ 在边界收窄一次；缺这个键就补上（旧页面也是"读到就补"）。
 */
function optionsOf(entity: unknown): ModelGenerateOptions {
  const record = (entity ?? {}) as ModelSettingSavePayload
  const metadata = record.metadata
  if (!metadata[MODEL_DEFAULT_OPTIONS_KEY] || typeof metadata[MODEL_DEFAULT_OPTIONS_KEY] !== 'object') {
    metadata[MODEL_DEFAULT_OPTIONS_KEY] = {}
  }
  return metadata[MODEL_DEFAULT_OPTIONS_KEY] as ModelGenerateOptions
}

/** 三类控件（数字 / 是-否 / 字符串）靠这三张清单分流（照抄旧页面） */
function isNumberOption(key: string): boolean {
  return (MODEL_GENERATE_OPTION_NUMBER_KEYS as readonly string[]).includes(key)
}

function isBooleanOption(key: string): boolean {
  return (MODEL_GENERATE_OPTION_BOOLEAN_KEYS as readonly string[]).includes(key)
}

function isStringOption(key: string): boolean {
  return (MODEL_GENERATE_OPTION_STRING_KEYS as readonly string[]).includes(key)
}
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="modelSettingFormPage"
    :context-extra="{closeLayoutTab}"
    @success="onSuccess"
    @stale="onStale"
  >
    <!-- 字段行之后：默认参数（旧页面同一个 `a-collapse`，位置与行为照旧） -->
    <template #default="{entity}">
      <a-collapse expand-icon-placement="end" :class="entity.id ? undefined : 'mb-lg'">
        <a-collapse-panel>
          <template #header>
            <icon-font class="icon aligin" type="loncra-sliders-horizontal" />
            {{ $t('aiServer.modelSetting.defaultOptions') }}
          </template>
          <a-space orientation="vertical" class="w-full">
            <a-flex
              justify="space-between"
              align="center"
              :key="key"
              v-for="key in MODEL_GENERATE_OPTION_KEYS"
            >
              <a-flex vertical :gap="2">
                <a-typography-text strong>
                  {{ $t(`aiServer.modelSetting.options.${key}.label`) }}
                </a-typography-text>
                <a-typography-text type="secondary" class="text-sm">
                  {{ $t(`aiServer.modelSetting.options.${key}.help`) }}
                </a-typography-text>
              </a-flex>
              <a-input-number
                class="w-25"
                v-if="isNumberOption(key)"
                v-model:value="optionsOf(entity)[key] as number | null"
              />
              <a-select
                v-else-if="isBooleanOption(key)"
                class="w-25"
                allow-clear
                v-model:value="optionsOf(entity)[key] as number | undefined"
                :options="yesOrNoOptions"
                :field-names="{label: 'name'}"
              />
              <a-input
                class="w-25"
                v-else-if="isStringOption(key)"
                v-model:value="optionsOf(entity)[key] as string"
                allow-clear
              />
            </a-flex>
          </a-space>
        </a-collapse-panel>
      </a-collapse>
    </template>
  </crud-form-page>
</template>
