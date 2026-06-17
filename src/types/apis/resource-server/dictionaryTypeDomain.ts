import type {PageRequest, VersionEntityMetadata} from "@/types/apis/common";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import type {DataDictionaryEntity} from "@/types/apis";

/**
 * 字典类型保存请求体
 *
 * maurice.chen
 */
export interface DictionaryTypeSavePayload extends VersionEntityMetadata {
  /**
   * 代码
   */
  code:string

  /**
   * 名称
   */
  name:string

  /**
   * 父类 id
   */
  parentId?:number

  /**
   * 备注
   */
  remark?:string


}

/**
 * 字典类型数据类型
 * @author maurice.chen
 */
export interface DictionaryTypeEntity extends DictionaryTypeSavePayload {
  /**
   * 子节点
   */
  children:DictionaryTypeEntity[];
}

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
  query:PageRequest
  selectedRows: DataDictionaryEntity[]
  columns: SearchableColumnType[]
}
