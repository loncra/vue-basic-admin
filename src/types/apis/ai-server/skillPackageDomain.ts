import type {
  BasicIdMetadata,
  DataDictionaryMetadata,
  NameValueEnumMetadata,
  VersionEntityMetadata,
} from '@/types/apis'
import {SKILL_SOURCE_TYPE} from "@/constants";


export type SkillSourceMetadataType = typeof SKILL_SOURCE_TYPE.GIT | typeof SKILL_SOURCE_TYPE.MANUAL

export interface SkillSourceMetadata {
  type:SkillSourceMetadataType
}
export interface ManualSkillSourceMetadata extends SkillSourceMetadata{
  type: typeof SKILL_SOURCE_TYPE.MANUAL
}

export interface GitSkillSourceMetadata extends SkillSourceMetadata{
  type: typeof SKILL_SOURCE_TYPE.GIT
  url: string
  ref?: string
  sha?: string
  path?: string
}

export interface SkillPackageMetadata {
  source:SkillSourceMetadata
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
  executeStatus?: NameValueEnumMetadata<number> | number
}

export interface SkillPackageEntity extends SkillPackageSavePayload {
}
