import type {VersionEntityMetadata} from "@/types/apis/common";

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
