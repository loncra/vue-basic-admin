import type {PageRequest} from '@loncra/client/commons'
import type {
  DataDictionaryEntity,
  DictionaryTypeEntity,
  DictionaryTypeSavePayload
} from '@loncra/client/resource'
import type {ActionDefinition, SearchableColumnType} from '@/types/composables'

export interface DictionaryTypeProps {
  columns: SearchableColumnType[]
  openKeys: number[]
  parent?: DictionaryTypeEntity
  dataSource: DictionaryTypeEntity[]
  formOpen: boolean
  selectedRows: DictionaryTypeEntity[]
  entity: DictionaryTypeSavePayload
  rowActions: ActionDefinition<DictionaryTypeEntity>[]
}

export interface DataDictionary {
  query: PageRequest
  selectedRows: DataDictionaryEntity[]
  columns: SearchableColumnType[]
}
