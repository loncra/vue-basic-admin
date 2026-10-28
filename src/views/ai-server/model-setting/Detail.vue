<script setup lang="ts">
import {computed, ref} from 'vue'
import type {ModelGenerateOptions, ModelSettingEntity} from '@loncra/client/ai'
import {
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
} from '@loncra/client/ai'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import {
  getEnumName,
  getEnumValue,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {booleanToYesOrNo} from '@/utils'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {AI_SERVER_MODEL_SETTING_ROUTE, MODEL_SETTING_MANUFACTURER_CODE_QUERY} from '@/constants'
import {modelSettingDetailPage} from './model-setting.detail.page'

defineOptions({
  name: 'AiServerModelSettingDetail',
})

const configProviderStore = useConfigProviderStore()
const detailRef = ref<{entity?: ModelSettingEntity; buckets?: EnumBucketsResponseBody}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

const {onStale} = usePageExit({
  redirect: () => {
    const code = detailRef.value?.entity?.manufacturer?.code
    return {
      name: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
      query: code ? {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: code} : {},
    }
  },
})

const yesOrNoOptions = computed(
  () =>
    (detailRef.value?.buckets?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
      SYSTEM_ENUM_TYPE.YES_OR_NO
    ] ?? []) as NameValueEnumMetadata<number>[],
)

function optionDisplay(entity: unknown, key: (typeof MODEL_GENERATE_OPTION_KEYS)[number]): string {
  const record = (entity ?? {}) as ModelSettingEntity
  const raw = record.metadata?.[MODEL_DEFAULT_OPTIONS_KEY]
  const options = (raw && typeof raw === 'object' ? raw : {}) as ModelGenerateOptions
  const value = options[key]
  if (value === null || value === undefined || value === '') {
    return ''
  }
  if ((MODEL_GENERATE_OPTION_BOOLEAN_KEYS as readonly string[]).includes(key)) {
    const yn = booleanToYesOrNo(value)
    const matched = yesOrNoOptions.value.find((item) => getEnumValue(item) === yn)
    return matched ? getEnumName(matched) : String(yn)
  }
  return String(value)
}
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="modelSettingDetailPage"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon align" type="loncra-sliders-horizontal" />
          {{ $t('aiServer.modelSetting.defaultOptions') }}
        </a-space>
      </a-divider>
      <a-descriptions
        bordered
        :layout="configProviderStore.antdv.state.detailLayout"
        :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}"
      >
        <a-descriptions-item
          v-for="key in MODEL_GENERATE_OPTION_KEYS"
          :key="key"
          :label="$t(`aiServer.modelSetting.options.${key}.label`)"
        >
          {{ optionDisplay(entity, key) }}
        </a-descriptions-item>
      </a-descriptions>
    </template>
  </crud-detail-page>
</template>
