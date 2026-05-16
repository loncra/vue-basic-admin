import type {NameValueEnumMetadata, VersionEntityMetadata,} from "@/types";

/**
 * 字典类型保存请求体
 *
 * maurice.chen
 */
export interface DataDictionarySavePayload extends VersionEntityMetadata {

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

  /**
   * 值
   */
  value:string

  /**
   * 值类型
   */
  valueType:NameValueEnumMetadata<number> | number

  /**
   * 等级
   */
  level?:string

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
  /**
   * 子节点
   */
  children:DataDictionaryEntity[];
}
