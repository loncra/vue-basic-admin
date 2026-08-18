<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import {ModelSettingService} from '@/apis/ai-server/modelSettingService.ts'
import {ResourceServerService} from '@/apis'
import {booleanToYesOrNo, getEnumName, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from 'vue'
import type {
  EnumBucketsResponseBody,
  ModelGenerateOptions,
  ModelSettingEntity,
  NameValueEnumMetadata,
  RestResult,
} from '@/types/apis'
import {
  AI_SERVER_MODEL_SETTING_ROUTE,
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  MODEL_TYPE,
  OPERATION_DATA_TRACE_TABLE,
  VALUE_TYPE,
  YES_OR_NO_TYPE,
} from '@/constants'
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";

defineOptions({
  name: 'AiServerModelSettingDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const configProviderStore = useConfigProviderStore()

const service = new ModelSettingService()
const yesOrNoOptions = ref<NameValueEnumMetadata<number>[]>([])
const entity = ref<ModelSettingEntity>({
  id: 0,
  version: 0,
  name: '',
  model: '',
  icon: null,
  type: MODEL_TYPE.CHAT,
  enabled: YES_OR_NO_TYPE.YES,
  remark: '',
  description: '',
  manufacturer: {
    code: '',
    name: '',
    value: '',
    valueType: VALUE_TYPE.STRING,
    metadata: {},
  },
  metadata: {
    [MODEL_DEFAULT_OPTIONS_KEY]: {},
  },
})

const generateOptions = computed(() => {
  const raw = entity.value.metadata?.[MODEL_DEFAULT_OPTIONS_KEY]
  return (raw && typeof raw === 'object' ? raw : {}) as ModelGenerateOptions
})

function optionDisplay(key: (typeof MODEL_GENERATE_OPTION_KEYS)[number]) {
  const value = generateOptions.value[key]
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

const redirect = computed(() => {
  const code = entity.value.manufacturer?.code
  return {
    name: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
    query: code ? {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: code} : {},
  }
})

onMounted(async () => {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      'resource-server': [{id: 'YesOrNo'}],
    })
  if (enums.data) {
    yesOrNoOptions.value = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
  }
})
</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.AI_MODEL_SETTING"
      :redirect="redirect"
      :title-text="(title: string, _entity: ModelSettingEntity) => title + ' (' + _entity.name + ')'"
      :service="service"
      :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{ entity.id }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.name')">
        {{ entity.name }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.modelSetting.model')">
        {{ entity.model }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.modelSetting.icon')">
        <icon-font class="icon" :type="entity.icon || 'loncra-sticker'" />
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.enabled')">
        {{ getEnumName(entity.enabled) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.modelSetting.manufacturer')">
        <a-space>
          <icon-font
            class="icon"
            :type="String(entity.manufacturer?.metadata?.icon || 'loncra-building')"
          />
          <span>{{ entity.manufacturer?.name || '' }}</span>
        </a-space>
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.sort')">
        {{ entity.sort ?? '' }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.modelSetting.description')" :span="2">
        {{ entity.description || '' }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.remark')" :span="2">
        {{ entity.remark || '' }}
      </a-descriptions-item>

      <template #afterDescriptions>
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="loncra-sliders-horizontal" />
            {{ globalProperties.$t('aiServer.modelSetting.defaultOptions') }}
          </a-space>
        </a-divider>
        <a-descriptions
          bordered
          :layout="configProviderStore.state.detailLayout"
          :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}"
        >
          <a-descriptions-item
            v-for="key in MODEL_GENERATE_OPTION_KEYS"
            :key="key"
            :label="globalProperties.$t(`aiServer.modelSetting.options.${key}.label`)"
          >
            {{ optionDisplay(key) }}
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </l-basic-detail>
  </div>
</template>
