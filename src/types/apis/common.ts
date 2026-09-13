import type {PlatformUser} from '@loncra/client/auth'

/** 选人面板等 UI 用，依赖 auth 的 PlatformUser，不进 client commons */
export interface ContactItem {
  key: string
  label?: string
  data: PlatformUser
  disabled?: boolean
  group?: string
  [key: string]: unknown
}
