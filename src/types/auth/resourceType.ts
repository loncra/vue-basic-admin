import type { NameValueEnumMetadata } from '@/types/common'
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";

/** 资源类型：根/目录/菜单/安全/工具 */
export type ResourceType =
  | typeof RESOURCE_TYPE.TOOL
  | typeof RESOURCE_TYPE.ROOT
  | typeof RESOURCE_TYPE.MENU
  | typeof RESOURCE_TYPE.DIRECTORY
  | typeof RESOURCE_TYPE.SECURITY

export interface MenuData {
  /**
   * 资源名称
   */
  name: string
  /**
   * 图标
   */
  icon: string
  /**
   * 所属应用名称
   */
  applicationName: string
  /**
   * 路由页面
   */
  page:string

}

/**
 * 资源数据类型
 * @author maurice.chen
 */
export interface ResourceData extends MenuData {
  key: string,
  /**
   * 主键 id
   */
  id: number

  /**
   * 权限名称
   */
  authority: string

  /**
   * 类型:MENU.菜单类型、SECURITY.安全类型
   */
  type: NameValueEnumMetadata<string>

  /**
   * 来源
   */
  sources: NameValueEnumMetadata<string>[]

  /**
   * 版本号
   */
  version: string

  /**
   * 父类 id
   */
  parentId?: number

  /**
   * 顺序值
   */
  sort: number

  /**
   * 备注
   */
  remark: string
  /**
   * 子节点
   */
  children?: ResourceData[]
}
