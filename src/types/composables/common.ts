import {CONFIG_PROVIDER, CONFIG_PROVIDER_THEME} from "@/constants/systemConstant.ts";

export interface IconfontGlyph {
  font_class: string
  name: string
  icon_id:string
  unicode:string
  unicode_decimal:number
}
export interface IconfontJson {
  name: string
  css_prefix_text: string
  description:string
  glyphs: IconfontGlyph[]
}

export type RouteTitleParams = Record<string, string>

export type RouteTitleSpec = readonly [string, RouteTitleParams?]

export type RouteTitleGetter = () => RouteTitleSpec

export type RouteTitleMap = Record<string, RouteTitleGetter>

/**
 * 树形节点接口
 * 用于表示树形结构的数据节点，支持递归的父子关系
 *
 * @template T - 节点数据类型
 */
export type TreeLike<T> = T & {
  children?: TreeLike<T>[]
}

/**
 * 视频缩略图结果接口
 * 包含视频缩略图的 Base64 数据和视频 URL
 */
export interface VideoThumbnailResult {
  /** Base64 编码的缩略图数据 */
  base64: string
  /** 视频文件的 URL */
  videoUrl: string
}

/**
 * 通用权限码：详情、删除（列表行内与详情页可共用）
 */
export interface BasicAuthorityProps {
  detail?:string | boolean
  delete?:string | boolean
}

export interface LogoProps {
  /**
   * logo 标题
   */
  text?: string
  /**
   * logo icon
   */
  icon?: string
  /**
   * 是否隐藏 标题
   */
  hideText?: boolean
}