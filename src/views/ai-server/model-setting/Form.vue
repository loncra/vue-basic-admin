<script setup lang="ts">
import {type ComponentInternalInstance, computed, getCurrentInstance, inject, ref} from 'vue'
import type {
  DataDictionaryMetadata,
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
import {
  AI_SERVER_MODEL_SETTING_ROUTE,
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_GENERATE_OPTION_NUMBER_KEYS,
  MODEL_GENERATE_OPTION_STRING_KEYS,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  MODEL_TYPE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_CONSTANT,
  SYSTEM_MODULE_NAME,
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

function createEmptyManufacturer(): ModelSettingManufacturerMetadata {
  return {
    code: '',
    name: '',
    value: '',
    valueType: VALUE_TYPE.STRING,
    metadata: {},
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
    name: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
    query: code ? {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: code} : {},
  }
})

async function loadManufacturerByCode(code: string) {
  const result:RestResult<Record<string, DataDictionaryMetadata[]>> = await ResourceServerService.findDataDictionariesByCodes([code])
  if (!result.data) {
    return false
  }
  const entity = result.data[code]?.[0]
  if (!entity) {
    return false
  }
  options.value.entity.manufacturer = entity as ModelSettingManufacturerMetadata
  return true
}

async function preMounted() {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.AI_SERVER]: [{id: 'ModelTypeEnum'}],
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [{id: 'YesOrNo'}],
    })
  if (enums.data) {
    options.value.typeOptions = enums.data[SYSTEM_MODULE_NAME.AI_SERVER]?.ModelTypeEnum as NameValueEnumMetadata<number>[]
    options.value.enabledOptions = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.YesOrNo as NameValueEnumMetadata<number>[]
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
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.AI_MODEL_SETTING"
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

      <a-form-item name="description" :label="globalProperties.$t('aiServer.modelSetting.description')">
        <a-textarea v-model:value="options.entity.description" :rows="3" show-count :maxlength="512" />
      </a-form-item>
      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="3" show-count :maxlength="256" />
      </a-form-item>

      <a-collapse expand-icon-placement="end" :class="options.entity.id ? undefined : 'mb-lg'">
        <a-collapse-panel>
          <template #header>
            <icon-font class="icon aligin" type="loncra-sliders-horizontal" />
            {{ globalProperties.$t('aiServer.modelSetting.defaultOptions') }}
          </template>
          <a-space orientation="vertical" class="w-full" >
            <a-flex justify="space-between" align="center" :key="key" v-for="key in MODEL_GENERATE_OPTION_KEYS">
              <a-flex vertical :gap="2">
                <a-typography-text strong>
                  {{ globalProperties.$t(`aiServer.modelSetting.options.${key}.label`) }}
                </a-typography-text>
                <a-typography-text type="secondary" class="text-sm">
                  {{ globalProperties.$t(`aiServer.modelSetting.options.${key}.help`) }}
                </a-typography-text>
              </a-flex>
              <a-input-number
                class="w-25"
                v-if="isNumberOption(key)"
                v-model:value="generateOptions[key] as number | null"
              />
              <a-select
                v-else-if="isBooleanOption(key)"
                class="w-25"
                allow-clear
                v-model:value="generateOptions[key] as number | undefined"
                :options="options.enabledOptions"
                :field-names="{label: 'name'}"
              />
              <a-input
                class="w-25"
                v-else-if="isStringOption(key)"
                v-model:value="generateOptions[key] as string"
                allow-clear
              />
            </a-flex>
          </a-space>
        </a-collapse-panel>
      </a-collapse>

    </l-basic-form>
  </div>
</template>
