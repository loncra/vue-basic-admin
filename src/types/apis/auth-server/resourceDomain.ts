import type {BasicIdMetadata, NameValueEnumMetadata} from '@/types/apis/common'
import {RESOURCE_TYPE} from "@/constants/authConstant.ts";
import type {RouteRecordName} from "vue-router";

export interface ResourceMetadata {
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
  page: string
  /**
   * 顺序值
   */
  sort: number
}

export interface RouteResourceMetadata extends ResourceMetadata {
  path: string,
  fixed: boolean
  deactivatedClose: boolean
  single: boolean
  route: RouteRecordName,
  dynamicTitle: boolean,
}

export interface ResourceSavePayload extends ResourceMetadata, BasicIdMetadata<number> {
  /**
   * 版本号
   */
  version:string

  /**
   * 备注
   */
  remark?: string

  /**
   * 权限名称
   */
  authority: string

  /**
   * 类型:MENU.菜单类型、SECURITY.安全类型
   */
  type: NameValueEnumMetadata<string> | string

  /**
   * 来源
   */
  sources: NameValueEnumMetadata<string>[] | string[]

  /**
   * 类别
   */
  category: NameValueEnumMetadata<number> | number

  /**
   * 是否启用
   */
  enabled: NameValueEnumMetadata<number> | number

  /**
   * 父类 id
   */
  parentId?: number
}

/**
 * 资源数据类型
 * @author maurice.chen
 */
export interface ResourceEntity extends ResourceSavePayload {
  key: string,
  /**
   * 代码
   */
  code:string
  /**
   * 子节点
   */
  children?: ResourceEntity[]
}
