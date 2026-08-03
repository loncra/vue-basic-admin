import type {NameValueEnumMetadata, VersionEntityMetadata,} from "@/types/apis/common";

export interface DataDictionaryMetadata {
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
   * 值
   */
  value?: string | number | boolean | null

  /**
   * 值类型
   */
  valueType:NameValueEnumMetadata<number> | number

  /**
   * 等级
   */
  level?:string

  /**
   * 子节点
   */
  children?:DataDictionaryEntity[];
  /**
   * 元数据信息
   */
  metadata?:Record<string, unknown>
}

/**
 * 字典类型保存请求体
 *
 * maurice.chen
 */
export interface DataDictionarySavePayload extends DataDictionaryMetadata, VersionEntityMetadata {

  /**
   * 备注
   */
  remark?:string

  /**
   * 值
   */
  value:string

  /**
   * 是否启用:0.禁用,1.启用
   */
  enabled:NameValueEnumMetadata<number> | number

  /**
   * 对应字典类型
   */
  typeId:number

  /**
   * 顺序值
   */
  sort?:number
}

/**
 * 字典类型数据类型
 * @author maurice.chen
 */
export interface DataDictionaryEntity extends DataDictionarySavePayload {

}
