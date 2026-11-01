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

export interface LogoProps {
  text?: string
  icon?: string
  hideText?: boolean
}

