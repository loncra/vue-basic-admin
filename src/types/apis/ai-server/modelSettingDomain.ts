import type {
  DataDictionaryMetadata,
  NameValueEnumMetadata,
  VersionEntityMetadata,
} from '@/types/apis'
import type {ModelGenerateOptionKey} from '@/constants'

/** 对齐 ModelResolver.buildGenerateOptions / metadata.options */
export type ModelGenerateOptions = Partial<
  Record<ModelGenerateOptionKey, number | string | boolean | null>
>

export interface ModelSettingManufacturerMetadata
  extends Pick<DataDictionaryMetadata, 'code' | 'name' | 'valueType' | 'metadata'> {
  value: string | number
}

export interface ModelSettingSavePayload extends VersionEntityMetadata {
  /**
   * 名称
   */
  name: string

  /**
   * 图标
   */
  icon: string | null

  /**
   * 类型
   */
  type: NameValueEnumMetadata<number> | number

  /**
   * 模型值
   */
  model: string

  /**
   * 是否启用
   */
  enabled: NameValueEnumMetadata<number> | number

  /**
   * 元数据信息（至少含 options）
   */
  metadata: {
    options?: ModelGenerateOptions
    [key: string]: unknown
  }

  /**
   * 备注
   */
  remark: string

  /**
   * 描述
   */
  description: string

  /**
   * 厂商（字典元数据快照）
   */
  manufacturer: ModelSettingManufacturerMetadata

  /**
   * 顺序值
   */
  sort?: number
}

export interface ModelSettingEntity extends ModelSettingSavePayload {}
