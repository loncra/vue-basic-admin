import {defineHomePage} from '@loncra/antdv-pro'
import type {DataDictionaryEntity, DataDictionarySavePayload} from '@loncra/client/resource'
import {RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY} from '@loncra/client/resource'
import {defineSearchProps} from '@/utils'
import {dataDictionaryCore} from './data-dictionary.page'

function hasTypeFilter(ctx: {query?: unknown}): boolean {
  return Boolean((ctx.query as Record<string, unknown> | undefined)?.['filter_[type_id_eq]'])
}

export const dataDictionaryHomePage = defineHomePage<DataDictionarySavePayload, DataDictionaryEntity>(
  dataDictionaryCore,
  {
    authority: {
      add: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.SAVE,
      edit: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.SAVE,
      delete: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.DELETE,
      detail: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.GET,
    },
    rowSelection: {fixed: true, type: 'checkbox'},
    drag: (record) => record.name,
    columns: [
      {key: 'name', search: defineSearchProps('input')},
      {key: 'code', search: defineSearchProps('input')},
      {key: 'valueType', search: defineSearchProps('select')},
      {key: 'level', search: defineSearchProps('input')},
      {key: 'enabled', search: defineSearchProps('select')},
    ],
    toolbarActions: [
      {id: 'add', visible: hasTypeFilter},
      {id: 'deleteSelected', visible: hasTypeFilter},
    ],
  },
)
