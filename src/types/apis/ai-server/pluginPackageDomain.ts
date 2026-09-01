import type {NameValueEnumMetadata, VersionEntityMetadata} from '@/types/apis/common'
import type {DataDictionaryMetadata} from '@/types/apis/resource-server'

/**
 * 广场包目录基类（对齐 Java `BasicPluginMetadata` + `PluginPackageMetadata`）
 *
 * JSON 多态 `metadata` 不在基类上：Skill / MCP 各自收窄。
 *
 * @author maurice.chen
 */
export interface PluginPackageMetadata extends VersionEntityMetadata {
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
}
