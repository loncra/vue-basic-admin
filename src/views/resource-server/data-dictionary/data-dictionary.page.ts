import type {DataDictionaryEntity, DataDictionarySavePayload} from '@loncra/client/resource'
import {DataDictionaryService} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  OPERATION_DATA_TRACE_TABLE,
  RESOURCE_SERVER_DATA_DICTIONARY_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

/**
 * 字典数据的 service。`Home.vue` 里的排序（`sort`）是**实例方法** ⇒ 导出，别重复 `new`。
 */
export const dataDictionaryService = new DataDictionaryService()

/** 字典数据（`Home.vue`）的**核心**：`service` / i18n / routes / `fields` 只写一次。 */
export const dataDictionaryCore: CrudPageCore<DataDictionarySavePayload, DataDictionaryEntity> = {
  service: dataDictionaryService,
  i18nPrefix: 'resourceServer.dataDictionary',
  routes: {
    home: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.HOME,
    add: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.ADD,
    edit: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.EDIT,
    detail: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.DETAIL,
  },
  /** `Form.vue` / `Detail.vue` 在用（渲染操作轨迹）⇒ 写 */
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.DATA_DICTIONARY,
  fields: {
    name: {labelKey: 'common.name'},
    code: {labelKey: 'common.code'},
    valueType: {
      labelKey: 'resourceServer.dataDictionary.valueType',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.VALUE_TYPE_ENUM},
    },
    level: {labelKey: 'resourceServer.dataDictionary.level'},
    enabled: {
      labelKey: 'common.enabled',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
  },
}
