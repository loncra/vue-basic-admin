<script setup lang="ts">
import {type ComponentInternalInstance, computed, getCurrentInstance, inject, ref} from 'vue'
import type {
  DataDictionaryEntity,
  EnumBucketsResponseBody,
  ModelGenerateOptions,
  ModelSettingEntity,
  ModelSettingManufacturerMetadata,
  ModelSettingSavePayload,
  NameValueEnumMetadata,
  RestResult,
} from '@/types/apis'
import {booleanToYesOrNo, getEnumValue, requireNonNullOrUndefined, yesOrNoToBoolean} from '@/utils'
import LBasicForm from '@/components/basic/form/BasicForm.vue'
import {ResourceServerService} from '@/apis'
import {ModelSettingService} from '@/apis/ai-server/modelSettingService.ts'
import {DataDictionaryService} from '@/apis/resource-server/dataDictionaryService.ts'
import {
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_GENERATE_OPTION_NUMBER_KEYS,
  MODEL_GENERATE_OPTION_STRING_KEYS,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  MODEL_TYPE,
  SYSTEM_CONSTANT,
  VALUE_TYPE,
  YES_OR_NO_TYPE,
} from '@/constants'
import {LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY} from '@/constants/systemConstant.ts'

defineOptions({
  name: 'AiServerModelSettingForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
  LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
)

const service = new ModelSettingService()
const dataDictionaryService = new DataDictionaryService()

function createEmptyManufacturer(): ModelSettingManufacturerMetadata {
  return {
    code: '',
    name: '',
    value: '',
    valueType: VALUE_TYPE.STRING,
    metadata: {},
  }
}

function toManufacturerSnapshot(entity: DataDictionaryEntity): ModelSettingManufacturerMetadata {
  return {
    code: entity.code,
    name: entity.name,
    value: entity.value ?? '',
    valueType: entity.valueType,
    metadata: entity.metadata ? {...entity.metadata} : {},
  }
}

function cleanGenerateOptions(source: ModelGenerateOptions | undefined): ModelGenerateOptions {
  const cleaned: ModelGenerateOptions = {}
  if (!source) {
    return cleaned
  }
  for (const key of MODEL_GENERATE_OPTION_KEYS) {
    const value = source[key]
    if (value === null || value === undefined || value === '') {
      continue
    }
    if ((MODEL_GENERATE_OPTION_BOOLEAN_KEYS as readonly string[]).includes(key)) {
      const bool = yesOrNoToBoolean(value)
      if (bool !== undefined) {
        cleaned[key] = bool
      }
      continue
    }
    cleaned[key] = value
  }
  return cleaned
}

function ensureOptionsBinding(entity: ModelSettingSavePayload) {
  const metadata = entity.metadata && typeof entity.metadata === 'object' ? entity.metadata : {}
  const rawOptions = metadata[MODEL_DEFAULT_OPTIONS_KEY]
  const nextOptions: ModelGenerateOptions =
    rawOptions && typeof rawOptions === 'object' ? {...(rawOptions as ModelGenerateOptions)} : {}
  for (const key of MODEL_GENERATE_OPTION_BOOLEAN_KEYS) {
    if (nextOptions[key] === null || nextOptions[key] === undefined || nextOptions[key] === '') {
      continue
    }
    nextOptions[key] = booleanToYesOrNo(nextOptions[key]) as number
  }
  entity.metadata = {
    ...metadata,
    [MODEL_DEFAULT_OPTIONS_KEY]: nextOptions,
  }
  return entity
}

const options = ref<{
  entity: ModelSettingSavePayload
  typeOptions: NameValueEnumMetadata<number>[]
  enabledOptions: NameValueEnumMetadata<number>[]
  spinning: boolean
}>({
  spinning: false,
  entity: {
    id: null as unknown as number,
    version: null as unknown as number,
    name: '',
    model: '',
    icon: null,
    type: MODEL_TYPE.CHAT,
    enabled: YES_OR_NO_TYPE.YES,
    remark: '',
    description: '',
    manufacturer: createEmptyManufacturer(),
    metadata: {
      [MODEL_DEFAULT_OPTIONS_KEY]: {},
    },
  },
  typeOptions: [],
  enabledOptions: [],
})

const generateOptions = computed({
  get: () => {
    const metadata = options.value.entity.metadata
    if (!metadata[MODEL_DEFAULT_OPTIONS_KEY] || typeof metadata[MODEL_DEFAULT_OPTIONS_KEY] !== 'object') {
      metadata[MODEL_DEFAULT_OPTIONS_KEY] = {}
    }
    return metadata[MODEL_DEFAULT_OPTIONS_KEY] as ModelGenerateOptions
  },
  set: (value: ModelGenerateOptions) => {
    options.value.entity.metadata = {
      ...options.value.entity.metadata,
      [MODEL_DEFAULT_OPTIONS_KEY]: value,
    }
  },
})

const redirect = computed(() => {
  const code = options.value.entity.manufacturer?.code
  return {
    name: 'ai_server_model_setting',
    query: code ? {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: code} : {},
  }
})

async function loadManufacturerByCode(code: string) {
  const result = await dataDictionaryService.page({
    number: 1,
    size: 1,
    ['filter_[code_eq]']: code,
  })
  const entity = result.data?.elements?.[0]
  if (!entity) {
    return false
  }
  options.value.entity.manufacturer = toManufacturerSnapshot(entity)
  return true
}

async function preMounted() {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      'ai-server': [{id: 'ModelTypeEnum'}],
      'resource-server': [{id: 'YesOrNo'}],
    })
  if (enums.data) {
    options.value.typeOptions = enums.data['ai-server']?.ModelTypeEnum as NameValueEnumMetadata<number>[]
    options.value.enabledOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
  }

  const isEdit = globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] !== undefined
  if (isEdit) {
    return
  }

  const manufacturerCode = globalProperties.$route.query[
    MODEL_SETTING_MANUFACTURER_CODE_QUERY
  ] as string
  if (!manufacturerCode) {
    const field = MODEL_SETTING_MANUFACTURER_CODE_QUERY
    sessionStorage.setItem(
      import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME,
      JSON.stringify([
        {code: '400', field, defaultMessage: globalProperties.$t('error.notNull')},
      ]),
    )
    globalProperties.$router.push({name: '400'})
    closeLayoutTab?.(globalProperties.$route.fullPath, false)
    return
  }

  const loaded = await loadManufacturerByCode(manufacturerCode)
  if (!loaded) {
    sessionStorage.setItem(
      import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME,
      JSON.stringify([
        {
          code: '400',
          field: MODEL_SETTING_MANUFACTURER_CODE_QUERY,
          defaultMessage: globalProperties.$t('error.notNull'),
        },
      ]),
    )
    globalProperties.$router.push({name: '400'})
    closeLayoutTab?.(globalProperties.$route.fullPath, false)
  }
}

function postGetEntity(entity: ModelSettingEntity) {
  const next = ensureOptionsBinding({...entity})
  next.type = getEnumValue(next.type) ?? next.type
  next.enabled = getEnumValue(next.enabled) ?? next.enabled
  if (!next.manufacturer) {
    next.manufacturer = createEmptyManufacturer()
  }
  return next
}

async function preSubmit() {
  options.value.entity.metadata = {
    ...options.value.entity.metadata,
    [MODEL_DEFAULT_OPTIONS_KEY]: cleanGenerateOptions(generateOptions.value),
  }
}

function setPageTitle(title: string, entity: ModelSettingEntity | ModelSettingSavePayload) {
  if (entity.id) {
    return title + ' (' + entity.name + ')'
  }
  if (entity.manufacturer?.name) {
    return title + ' (' + entity.manufacturer.name + ')'
  }
  return title
}

function isNumberOption(key: string) {
  return (MODEL_GENERATE_OPTION_NUMBER_KEYS as readonly string[]).includes(key)
}

function isBooleanOption(key: string) {
  return (MODEL_GENERATE_OPTION_BOOLEAN_KEYS as readonly string[]).includes(key)
}

function isStringOption(key: string) {
  return (MODEL_GENERATE_OPTION_STRING_KEYS as readonly string[]).includes(key)
}
</script>

<template>
  <div>
    <l-basic-form
      operation-data-trace-target="tb_ai_model_setting"
      :pre-mounted="preMounted"
      :post-get-entity="postGetEntity"
      :pre-submit="preSubmit"
      :title-text="setPageTitle"
      :redirect="redirect"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="name"
            :label="globalProperties.$t('common.name')"
            :rules="[{required: true}]"
          >
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="model"
            :label="globalProperties.$t('aiServer.modelSetting.model')"
            :rules="[{required: true}]"
          >
            <a-input v-model:value="options.entity.model" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="icon" :label="globalProperties.$t('aiServer.modelSetting.icon')">
            <a-input v-model:value="options.entity.icon" allow-clear />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="type" :label="globalProperties.$t('common.type')" :rules="[{required: true}]">
            <a-select
              class="w-full"
              v-model:value="options.entity.type"
              :options="options.typeOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="enabled"
            :label="globalProperties.$t('common.enabled')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.enabled"
              :options="options.enabledOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            :name="['manufacturer', 'name']"
            :label="globalProperties.$t('aiServer.modelSetting.manufacturer')"
          >
            <a-input :value="options.entity.manufacturer.name" disabled />
          </a-form-item>
        </a-col>
      </template>

      <a-divider class="m-0 mb-md" orientation="left" plain>
        <a-space>
          <icon-font class="icon" type="loncra-sliders-horizontal" />
          {{ globalProperties.$t('aiServer.modelSetting.defaultOptions') }}
        </a-space>
      </a-divider>

      <a-row :gutter="16">
        <a-col
          v-for="key in MODEL_GENERATE_OPTION_KEYS"
          :key="key"
          :xs="24"
          :sm="24"
          :md="12"
          :lg="12"
          :xl="12"
          :xxl="12"
        >
          <a-form-item
            :name="['metadata', MODEL_DEFAULT_OPTIONS_KEY, key]"
            :label="globalProperties.$t(`aiServer.modelSetting.options.${key}.label`)"
            :help="globalProperties.$t(`aiServer.modelSetting.options.${key}.help`)"
          >
            <a-input-number
              v-if="isNumberOption(key)"
              class="w-full"
              v-model:value="generateOptions[key] as number | null"
            />
            <a-select
              v-else-if="isBooleanOption(key)"
              class="w-full"
              allow-clear
              v-model:value="generateOptions[key] as number | undefined"
              :options="options.enabledOptions"
              :field-names="{label: 'name'}"
            />
            <a-input
              v-else-if="isStringOption(key)"
              v-model:value="generateOptions[key] as string"
              allow-clear
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item name="description" :label="globalProperties.$t('aiServer.modelSetting.description')">
        <a-textarea v-model:value="options.entity.description" :rows="3" show-count :maxlength="512" />
      </a-form-item>
      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="3" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
