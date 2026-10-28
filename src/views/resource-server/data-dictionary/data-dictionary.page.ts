import type {DataDictionaryEntity, DataDictionarySavePayload} from '@loncra/client/resource'
import {DataDictionaryService} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {RESOURCE_SERVER_DATA_DICTIONARY_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const dataDictionaryService = new DataDictionaryService()

export const dataDictionaryCore: CrudPageCore<DataDictionarySavePayload, DataDictionaryEntity> = {
  service: dataDictionaryService,
  i18nPrefix: 'resourceServer.dataDictionary',
  routes: {
    home: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.HOME,
    add: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.ADD,
    edit: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.EDIT,
    detail: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.DETAIL,
  },
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
    sort: {labelKey: 'common.sort'},
    value: {labelKey: 'common.value'},
    remark: {labelKey: 'common.remark'},
  },
}
