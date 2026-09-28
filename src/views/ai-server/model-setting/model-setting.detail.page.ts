import {h} from 'vue'
import {Space} from 'antdv-next'
import {AI_SERVER_MODEL_TYPE, type ModelSettingEntity} from '@loncra/client/ai'
import {defineDetailPage} from '@loncra/antdv-pro'
import {MODEL_DEFAULT_OPTIONS_KEY, VALUE_TYPE, YES_OR_NO_TYPE} from '@/constants'
import {renderIconFont} from '@/utils'
import {modelSettingCore} from './model-setting.page'

/** `a-descriptions` 的响应式列数（照抄旧 `Detail.vue` 的 `:column`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 模型设置详情（`Detail.vue`）。核心在 `model-setting.page.ts`，这里只写详情形态。
 *
 * 三处照旧：
 * - `type` / `enabled` 在核心字典里写 `format: 'enum'`（= `getEnumName`）⇒ 不手写 `render`；
 * - 图标**缺省画 `loncra-sticker`**（旧页面 `entity.icon || 'loncra-sticker'`）—— 图标怎么画由宿主
 *   注入（`renderIconFont`，它会带上 `class="icon"`）；
 * - 厂商是「厂商标（`metadata.icon`，缺省 `loncra-building`）+ 名称」，旧页面用 `a-space` 并排 ⇒ `render`。
 *
 * 「默认参数」那张附表（`metadata.model_default_options` + 是/否枚举）**不在声明里**：它的值是布尔，
 * 要拿枚举桶翻成「是/否」才知道怎么显示 ⇒ 照旧留在 `Detail.vue` 的 `#afterDescriptions` 里。
 */
export const modelSettingDetailPage = defineDetailPage(modelSettingCore, {
  column: COLUMN,
  /** 实体初值（照抄旧 `Detail.vue` 那坨 `ref<ModelSettingEntity>({...})`）：取数前就渲染 */
  createEntity: () => ({
    id: 0,
    version: 0,
    name: '',
    model: '',
    icon: null,
    type: AI_SERVER_MODEL_TYPE.CHAT,
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
    metadata: {[MODEL_DEFAULT_OPTIONS_KEY]: {}},
  }),
  fields: [
    'id',
    'name',
    'model',
    {key: 'icon', render: (value) => renderIconFont(String(value || 'loncra-sticker'))},
    'type',
    'enabled',
    {
      key: 'manufacturer',
      render: (_value, entity: ModelSettingEntity) =>
        h(Space, null, {
          default: () => [
            renderIconFont(String(entity.manufacturer?.metadata?.icon || 'loncra-building')),
            h('span', null, entity.manufacturer?.name || ''),
          ],
        }),
    },
    'sort',
    {key: 'description', span: 2},
    {key: 'remark', span: 2},
  ],
})
