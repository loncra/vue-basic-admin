import type {
  DataDictionaryMetadata,
  NameValueEnumMetadata,
  VersionEntityMetadata
} from "@/types/apis";


export interface ModelSettingSavePayload extends VersionEntityMetadata{

  /**
   * 名称
   */
  name: string;

  /**
   * 封面
   */
  icon: string;

  /**
   * 类型
   */
  type: NameValueEnumMetadata<number> | number;

  /**
   * 模型值
   */
  model: string;

  /**
   * 是否启用
   */
  enabled: NameValueEnumMetadata<number> | number;

  /**
   * 元数据信息
   */
  metadata: Record<string, unknown>;

  /**
   * 备注
   */
  remark: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 厂商
   */
  manufacturer: DataDictionaryMetadata;

}

export interface ModelSettingEntity extends ModelSettingSavePayload {

}
