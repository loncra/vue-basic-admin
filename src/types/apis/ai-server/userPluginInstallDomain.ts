import type {NameValueEnumMetadata} from '@/types/apis'

/**
 * 用户广场插件安装（对齐 `UserPluginInstallRequestBody` / `UserPluginInstallResult`）
 *
 * @author maurice.chen
 */
export interface UserPluginInstallRequestBody {
  targetType: number
  packageId: number
  workspaceScope: number
  agentConversationIds?: number[]
}

export interface UserPluginInstallResult {
  id?: number
  targetType?: NameValueEnumMetadata<number> | number
  packageId?: number
  workspaceScope?: NameValueEnumMetadata<number> | number
  status?: NameValueEnumMetadata<number> | number
  agentConversationIds?: number[]
}
