import type {
  BasicIdMetadata,
  DataDictionaryMetadata,
  NameValueEnumMetadata,
  ObjectWriteResult,
  VersionEntityMetadata,
} from '@/types/apis'
import type {FileItem} from "@/types/composables/fileEditor.ts";

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

export interface SkillPackageEntity extends SkillPackageSavePayload {
  files?: FileItem[]
}
