<script setup lang="ts">
import {computed, inject, ref} from 'vue'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {ModelGenerateOptions, ModelSettingSavePayload} from '@loncra/client/ai'
import {
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_GENERATE_OPTION_NUMBER_KEYS,
  MODEL_GENERATE_OPTION_STRING_KEYS,
} from '@loncra/client/ai'
import {CrudFormPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {
  AI_SERVER_MODEL_SETTING_ROUTE,
  LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
} from '@/constants'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {modelSettingFormPage} from './model-setting.form.page'

defineOptions({
  name: 'AiServerModelSettingForm',
})

const formRef = ref<{entity?: ModelSettingSavePayload; buckets?: EnumBucketsResponseBody}>()

const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
  LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
)

const {id} = useRequiredQuery(['id'], {required: false})

useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  if (!entity) {
    return undefined
  }
  return entity.id ? entity.name : entity.manufacturer?.name
})

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

const yesOrNoOptions = computed(
  () =>
    (formRef.value?.buckets?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
      SYSTEM_ENUM_TYPE.YES_OR_NO
    ] ?? []) as NameValueEnumMetadata<number>[],
)

function optionsOf(entity: unknown): ModelGenerateOptions {
  const record = (entity ?? {}) as ModelSettingSavePayload
  const metadata = record.metadata
  if (!metadata[MODEL_DEFAULT_OPTIONS_KEY] || typeof metadata[MODEL_DEFAULT_OPTIONS_KEY] !== 'object') {
    metadata[MODEL_DEFAULT_OPTIONS_KEY] = {}
  }
  return metadata[MODEL_DEFAULT_OPTIONS_KEY] as ModelGenerateOptions
}

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
