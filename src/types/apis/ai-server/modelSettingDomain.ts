import type {
  BasicIdMetadata,
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

export interface ModelSettingMetadata extends BasicIdMetadata<number>{
  /**
   * 名称
   */
  name: string

  /**
   * 模型值
   */
  model: string

  /**
   * 元数据信息（至少含 options）
   */
  metadata: {
    options?: ModelGenerateOptions
    [key: string]: unknown
  }

  /**
   * 厂商（字典元数据快照）
   */
  manufacturer: ModelSettingManufacturerMetadata

}

export interface ModelSettingSavePayload extends ModelSettingMetadata, VersionEntityMetadata {

  /**
   * 图标
   */
  icon: string | null

  /**
   * 类型
   */
  type: NameValueEnumMetadata<number> | number

  /**
   * 是否启用
   */
  enabled: NameValueEnumMetadata<number> | number

  /**
   * 备注
   */
  remark: string

  /**
   * 描述
   */
  description: string

  /**
   * 顺序值
   */
  sort?: number
}

export interface ModelSettingEntity extends ModelSettingSavePayload {}
