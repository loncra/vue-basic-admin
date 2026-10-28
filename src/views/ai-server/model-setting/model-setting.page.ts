import type {ModelSettingEntity, ModelSettingSavePayload} from '@loncra/client/ai'
import {ModelSettingService} from '@loncra/client/ai'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AI_SERVER_MODEL_SETTING_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const modelSettingService = new ModelSettingService()

export const modelSettingCore: CrudPageCore<ModelSettingSavePayload, ModelSettingEntity> = {
  service: modelSettingService,
  i18nPrefix: 'aiServer.modelSetting',
  routes: {
    home: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
    add: AI_SERVER_MODEL_SETTING_ROUTE.ADD,
    edit: AI_SERVER_MODEL_SETTING_ROUTE.EDIT,
    detail: AI_SERVER_MODEL_SETTING_ROUTE.DETAIL,
  },

  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.AI_MODEL_SETTING,

  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    model: {labelKey: 'aiServer.modelSetting.model'},
    icon: {labelKey: 'aiServer.modelSetting.icon'},
    manufacturer: {labelKey: 'aiServer.modelSetting.manufacturer'},
    sort: {labelKey: 'common.sort'},
    description: {labelKey: 'aiServer.modelSetting.description'},
    remark: {labelKey: 'common.remark'},
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.AI_SERVER, id: SYSTEM_ENUM_TYPE.MODEL_TYPE_ENUM},
    },
    enabled: {
      labelKey: 'common.enabled',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
  },
}
