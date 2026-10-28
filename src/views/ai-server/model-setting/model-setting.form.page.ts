import {h} from 'vue'
import {Input} from 'antdv-next'
import type {
  ModelGenerateOptions,
  ModelSettingManufacturerMetadata,
  ModelSettingSavePayload,
} from '@loncra/client/ai'
import {
  AI_SERVER_MODEL_TYPE,
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS
} from '@loncra/client/ai'
import {getEnumValue, SYSTEM_CONSTANT, VALUE_TYPE, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {defineFormPage} from '@loncra/antdv-pro'
import {ResourceServerService} from '@/apis'
import {booleanToYesOrNo, yesOrNoToBoolean} from '@/utils'
import i18n from '@/i18n'
import router from '@/routers'
import {MODEL_SETTING_MANUFACTURER_CODE_QUERY, SYSTEM_ROUTE} from '@/constants'
import {modelSettingCore} from './model-setting.page'

function reportBadRequest(
  field: string,
  closeLayoutTab?: (page: string, activate: boolean) => void,
): void {
  sessionStorage.setItem(
    import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME,
    JSON.stringify([
      {code: SYSTEM_ROUTE.BAD_REQUEST, field, defaultMessage: i18n.global.t('error.notNull', {field})},
    ]),
  )
  router.push({name: SYSTEM_ROUTE.BAD_REQUEST})
  closeLayoutTab?.(router.currentRoute.value.fullPath, false)
}

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

function ensureOptionsBinding<T extends ModelSettingSavePayload>(entity: T): T {
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

export const modelSettingFormPage = defineFormPage(modelSettingCore, {
    createEntity: () => ({
      id: null as unknown as number,
      version: null as unknown as number,
      name: '',
      model: '',
      icon: null,
      type: AI_SERVER_MODEL_TYPE.CHAT,
      enabled: YES_OR_NO_TYPE.YES,
      remark: '',
      description: '',
      manufacturer: createEmptyManufacturer(),
      metadata: {
        [MODEL_DEFAULT_OPTIONS_KEY]: {},
      },
    }),
    fields: [
      {key: 'name', component: 'input', rules: [{required: true}]},
      {key: 'model', component: 'input', rules: [{required: true}]},
      {key: 'icon', component: 'input'},
      {key: 'type', component: 'select', rules: [{required: true}]},
      {key: 'enabled', component: 'select', rules: [{required: true}]},
      {
        key: 'manufacturer',
        render: (ctx) => h(Input, {value: ctx.entity.manufacturer?.name, disabled: true}),
      },
      {
        key: 'description',
        component: 'textarea',
        col: {span: 24},
        props: {rows: 3, showCount: true, maxlength: 512},
      },
      {
        key: 'remark',
        component: 'textarea',
        col: {span: 24},
        props: {rows: 3, showCount: true, maxlength: 256},
      },
    ],
    preMounted: async (ctx) => {
      if (router.currentRoute.value.query[SYSTEM_CONSTANT.ID_NAME] !== undefined) {
        return
      }
      const closeLayoutTab = ctx.extra.closeLayoutTab as
        | ((page: string, activate: boolean) => void)
        | undefined
      const code = router.currentRoute.value.query[MODEL_SETTING_MANUFACTURER_CODE_QUERY] as
        | string
        | undefined
      if (!code) {
        reportBadRequest(MODEL_SETTING_MANUFACTURER_CODE_QUERY, closeLayoutTab)
        return
      }
      const result = await ResourceServerService.findDataDictionariesByCodes([code])
      const manufacturer = result.data?.[code]?.[0]
      if (!manufacturer) {
        reportBadRequest(MODEL_SETTING_MANUFACTURER_CODE_QUERY, closeLayoutTab)
        return
      }
      const entity = ctx.entity?.value
      if (entity) {
        entity.manufacturer = manufacturer as ModelSettingManufacturerMetadata
      }
    },
    postGetEntity: (entity) => {
      const next = ensureOptionsBinding({...entity})
      next.type = getEnumValue(next.type) ?? next.type
      next.enabled = getEnumValue(next.enabled) ?? next.enabled
      if (!next.manufacturer) {
        next.manufacturer = createEmptyManufacturer()
      }
      return next
    },
    preSubmit: (ctx) => {
      const entity = ctx.entity?.value
      if (!entity) {
        return
      }
      const raw = entity.metadata?.[MODEL_DEFAULT_OPTIONS_KEY]
      entity.metadata = {
        ...entity.metadata,
        [MODEL_DEFAULT_OPTIONS_KEY]: cleanGenerateOptions(
          raw && typeof raw === 'object' ? (raw as ModelGenerateOptions) : undefined,
        ),
      }
    },
  },
)
