import type {NameValueEnumMetadata, VersionEntityMetadata,} from "@/types/apis/common";
import type {RoleAuthority} from "@/types/apis";

/**
 * 企业角色保存请求体
 *
 * maurice.chen
 */
export interface EnterpriseRoleSavePayload extends VersionEntityMetadata, RoleAuthority {

  /**
   * 是否禁用
   */
  enabled:NameValueEnumMetadata<number> | number

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
 * 企业角色数据类型
 * @author maurice.chen
 */
export interface EnterpriseRoleEntity extends EnterpriseRoleSavePayload {
  /**
   * 子节点
   */
  children:EnterpriseRoleSavePayload[];
}
