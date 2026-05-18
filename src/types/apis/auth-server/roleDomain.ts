import type {NameValueEnumMetadata, VersionEntityMetadata,} from "@/types/apis/common";

/**
 * 角色保存请求体
 *
 * maurice.chen
 */
export interface RoleSavePayload extends VersionEntityMetadata {
  /**
   * 角色名称
   */
  name:string

  /**
   * 权限值
   */
  authority:string

  /**
   * 是否禁用
   */
  enabled:NameValueEnumMetadata<number> | number

  /**
   * 角色来源
   */
  sources:NameValueEnumMetadata<string>[] | string[]

  /**
   * 资源 id 集合
   */
  resourceIds:number[]


  /**
   * 父类 id
   */
  parentId?:number

  /**
   * 是否可删除:0.否、1.是
   */
  removable:NameValueEnumMetadata<number> | number

  /**
   * 是否可修改:0.否、1.是
   */
  modifiable:NameValueEnumMetadata<number> | number

  /**
   * 备注
   */
  remark?:string
}

/**
 * 角色数据类型
 * @author maurice.chen
 */
export interface RoleEntity extends RoleSavePayload {
  /**
   * 子节点
   */
  children:RoleEntity[];
}
