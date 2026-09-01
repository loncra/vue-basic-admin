import type {NameValueEnumMetadata, TimeProperties} from '@/types/apis'
import type {PluginPackageMetadata} from './pluginPackageDomain'
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
  updatePolicyTime?:TimeProperties
}

export interface SkillPackageSavePayload extends PluginPackageMetadata {
  latestVersion?: string
  defaultUpdatePolicy: NameValueEnumMetadata<number> | number
  sourceType?: NameValueEnumMetadata<number> | number
  metadata: SkillPackageMetadata
  executeStatus?: NameValueEnumMetadata<number> | number
}

export interface SkillPackageEntity extends SkillPackageSavePayload {
}

export interface SkillPackageSnapshotPayload {
  releaseVersion: string
  changelog?: string
}
