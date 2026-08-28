import type {
  BasicIdMetadata,
  DataDictionaryMetadata,
  NameValueEnumMetadata,
  VersionEntityMetadata,
} from '@/types/apis'

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
}

export interface SkillPackageEntity extends SkillPackageSavePayload {
}
