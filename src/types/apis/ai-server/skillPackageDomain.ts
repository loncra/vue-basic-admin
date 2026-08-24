import type {
  BasicIdMetadata,
  DataDictionaryMetadata,
  NameValueEnumMetadata,
  ObjectWriteResult,
  VersionEntityMetadata,
} from '@/types/apis'
import type {MenuItemType} from "@v-c/menu/dist/interface.js";
import {FOLDER_ADD_TYPE} from "@/constants";

export interface SkillPackageMetadata {
  source?: Record<string, unknown>
}

export interface SkillPackageSavePayload extends BasicIdMetadata<number>, VersionEntityMetadata {
  name: string
  packageKey: string
  summary?: string
  tags?: string[]
  additionalInformation?: string
  origin: NameValueEnumMetadata<number> | number
  status: NameValueEnumMetadata<number> | number
  type: NameValueEnumMetadata<number> | number
  icon: string
  category?: DataDictionaryMetadata
  latestVersion?: string
  defaultUpdatePolicy: NameValueEnumMetadata<number> | number
  sourceType?: NameValueEnumMetadata<number> | number
  metadata: SkillPackageMetadata
  file?: ObjectWriteResult
}

export interface SkillPackageFile extends Omit<MenuItemType, 'type'> {
  content?: string | ObjectWriteResult,
  type?: typeof FOLDER_ADD_TYPE.FILE | typeof FOLDER_ADD_TYPE.FOLDER
  editing?: boolean
  readonly?: boolean
  original?:string
  children?: SkillPackageFile[]
}

export interface SkillPackageEntity extends SkillPackageSavePayload {
  files?: SkillPackageFile[]
}
