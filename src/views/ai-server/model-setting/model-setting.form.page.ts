import {h} from 'vue'
import {Input} from 'antdv-next'
import type {
  ModelGenerateOptions,
  ModelSettingManufacturerMetadata,
  ModelSettingSavePayload,
} from '@loncra/client/ai'
import {AI_SERVER_MODEL_TYPE} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import {defineFormPage} from '@loncra/antdv-pro'
import {ResourceServerService} from '@/apis'
import {booleanToYesOrNo, yesOrNoToBoolean} from '@/utils'
import i18n from '@/i18n'
import router from '@/routers'
import {
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  SYSTEM_CONSTANT,
  SYSTEM_ROUTE,
  VALUE_TYPE,
  YES_OR_NO_TYPE,
} from '@/constants'
import {modelSettingCore} from './model-setting.page'

/** 厂商 code 缺失 / 字典里查不到时的兜底（照抄旧页面的 400 流程，与 `useRequiredQuery` 同一口径） */
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

/** 空厂商（旧页面的 `createEmptyManufacturer`） */
function createEmptyManufacturer(): ModelSettingManufacturerMetadata {
  return {
    code: '',
    name: '',
    value: '',
    valueType: VALUE_TYPE.STRING,
    metadata: {},
  }
}

/**
 * 默认参数提交前清洗（旧页面的 `cleanGenerateOptions`）：空值丢掉、布尔从「是/否」翻回 `boolean`。
 */
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

/**
 * 把 `metadata.默认参数` 摊平成一个稳定的对象引用（旧页面的 `ensureOptionsBinding`）：
 * 布尔项在实体里存的是「是/否」数字，这里统一成数字，界面（`#default` 插槽里的下拉）再翻成 boolean。
 */
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

/**
 * 模型设置新增/编辑（`Form.vue`）。核心在 `model-setting.page.ts`，这里只写表单形态。
 *
 * 与旧页面的对应关系（**照旧，不加工**）：
 * - 6 个字段两列一行（`col` 不给 = pro 默认 `xs24 sm24 md~xxxl 12`，正是旧页面的 `md:12`）；
 * - `type` / `enabled` 的 options 来自核心字典的 `enumRef` ⇒ 旧页面那段手拉枚举的 `preMounted`
 *   前半段**不再需要**（pro 的 `collectFormSources` 会自动拉桶）；
 * - 厂商名是**只读展示**（旧页面 `a-form-item name={['manufacturer','name']}` + disabled input）⇒ 用 `render`
 *   （表单字段的 key 不支持 `a.b` 路径）；
 * - `description` / `remark` 在旧页面里**不在 `#rowLayout`**（= 整行）⇒ 显式 `col: {span: 24}`；
 * - 「默认参数」那个 `a-collapse` 在字段行**之后** ⇒ 走壳的 `#default` 插槽（见 `Form.vue`）。
 */
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
      // 厂商：只读展示（值由 `preMounted` 从数据字典灌进来）
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
    /**
     * 新增态要靠 URL 上的厂商 code 从数据字典里查厂商（旧页面 `preMounted` 的后半段）；
     * 缺 code / 查不到 ⇒ 走 400（关 tab 由宿主通过 `contextExtra.closeLayoutTab` 递进来）。
     */
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
    /** 拿到服务端实体后：摊平默认参数、把 `type`/`enabled` 收成裸 code、厂商兜底（旧页面 `postGetEntity`） */
    postGetEntity: (entity) => {
      const next = ensureOptionsBinding({...entity})
      next.type = getEnumValue(next.type) ?? next.type
      next.enabled = getEnumValue(next.enabled) ?? next.enabled
      if (!next.manufacturer) {
        next.manufacturer = createEmptyManufacturer()
      }
      return next
    },
    /** 提交前把默认参数洗干净（旧页面 `preSubmit`） */
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
