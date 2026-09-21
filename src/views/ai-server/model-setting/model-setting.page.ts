import type {ModelSettingEntity, ModelSettingSavePayload} from '@loncra/client/ai'
import {ModelSettingService} from '@loncra/client/ai'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  AI_SERVER_MODEL_SETTING_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

/**
 * 页面 service。声明用它取数；排序（`sort`）是**实例方法**，
 * 壳拖拽后也得用同一个实例 ⇒ 导出，不重复 `new`。
 */
export const modelSettingService = new ModelSettingService()

/**
 * 模型设置的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 * 列表形态在 `model-setting.home.page.ts`；Form / Detail 还在宿主旧 kit。
 */
export const modelSettingCore: CrudPageCore<ModelSettingSavePayload, ModelSettingEntity> = {
  service: modelSettingService,
  i18nPrefix: 'aiServer.modelSetting',
  routes: {
    home: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
    add: AI_SERVER_MODEL_SETTING_ROUTE.ADD,
    edit: AI_SERVER_MODEL_SETTING_ROUTE.EDIT,
    detail: AI_SERVER_MODEL_SETTING_ROUTE.DETAIL,
  },

  /** 字段字典：labelKey / format / enumRef 只写一次 */
  fields: {
    name: {labelKey: 'common.name'},
    model: {labelKey: 'aiServer.modelSetting.model'},
    // 模型类型：后端 `ModelTypeEnum`（ai-server）
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.AI_SERVER, id: SYSTEM_ENUM_TYPE.MODEL_TYPE_ENUM},
    },
    // 启用：后端 `YesOrNo`（resource-server）
    enabled: {
      labelKey: 'common.enabled',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
  },
}
