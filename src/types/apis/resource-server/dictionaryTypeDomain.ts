import type {PageRequest} from '@loncra/client/commons'
import type {
  DataDictionaryEntity,
  DictionaryTypeEntity,
  DictionaryTypeSavePayload
} from '@loncra/client/resource'
import type {RecordActionDefinition, SearchableColumnType} from '@loncra/antdv-pro'

export interface DictionaryTypeProps {
  columns: SearchableColumnType<DictionaryTypeEntity>[]
  openKeys: number[]
  parent?: DictionaryTypeEntity
  dataSource: DictionaryTypeEntity[]
  formOpen: boolean
  selectedRows: DictionaryTypeEntity[]
  entity: DictionaryTypeSavePayload
  rowActions: RecordActionDefinition<DictionaryTypeEntity>[]
}

export interface DataDictionary {
  query: PageRequest
  selectedRows: DataDictionaryEntity[]
  columns: SearchableColumnType<DataDictionaryEntity>[]
}
