import {h} from 'vue'
import {Space} from 'antdv-next'
import {AI_SERVER_MODEL_TYPE, type ModelSettingEntity} from '@loncra/client/ai'
import {defineDetailPage} from '@loncra/antdv-pro'
import {
  MODEL_DEFAULT_OPTIONS_KEY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  VALUE_TYPE,
  YES_OR_NO_TYPE,
} from '@/constants'
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
    {key: 'description', span: 'filled'},
    {key: 'remark', span: 'filled'},
  ],
  /**
   * 唯一一处"**详情字段本身不引用、但宿主附表要用**"的来源：`#afterDescriptions` 那张「默认参数」表
   * 要把布尔值翻成「是/否」（`type` / `enabled` 那两处显示走的是值自带的 `name`，用不上桶）。
   * 详情形态**不从字段推导**来源 ⇒ 必须显式声明；声明后壳不再自己发请求（`Detail.vue` 那半个 `onMounted` 退役）。
   */
  enums: [{module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.YES_OR_NO]}],
})
