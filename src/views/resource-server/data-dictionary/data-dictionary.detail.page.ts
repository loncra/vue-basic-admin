import type {DataDictionaryEntity, DataDictionarySavePayload} from '@loncra/client/resource'
import {defineDetailPage} from '@loncra/antdv-pro'
import {dataDictionaryCore} from './data-dictionary.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

export const dataDictionaryDetailPage = defineDetailPage<
  DataDictionarySavePayload,
  DataDictionaryEntity
>(dataDictionaryCore, {
  column: COLUMN,
  fields: [
    'id',
    'name',
    'code',
    'valueType',
    'enabled',
    'level',
    'sort',
    {key: 'value', span: 'filled', format: 'enum'},
    {key: 'remark', span: 'filled'},
  ],
})
