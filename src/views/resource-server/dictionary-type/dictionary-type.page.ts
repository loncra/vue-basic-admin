import type {DictionaryTypeEntity, DictionaryTypeSavePayload} from '@loncra/client/resource'
import {DictionaryTypeService} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {OPERATION_DATA_TRACE_TABLE} from '@loncra/client/commons'

export const dictionaryTypeService = new DictionaryTypeService()

export const dictionaryTypeCore: CrudPageCore<DictionaryTypeSavePayload, DictionaryTypeEntity> = {
  service: dictionaryTypeService,
  i18nPrefix: 'resourceServer.dictionaryType',
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.DICTIONARY_TYPE,
  fields: {
    name: {labelKey: 'common.name'},
    code: {labelKey: 'common.code'},
  },
}
