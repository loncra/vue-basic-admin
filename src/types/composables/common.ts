export type {
  IconfontGlyph,
  IconfontJson,
  IconSelectAvatarModeValueType,
  IconSelectModeType,
  KeyValueRow,
} from '@loncra/antdv'

export type RouteTitleParams = Record<string, string>

export type RouteTitleSpec = readonly [string, RouteTitleParams?]

export type RouteTitleGetter = () => RouteTitleSpec

export type RouteTitleMap = Record<string, RouteTitleGetter>

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

