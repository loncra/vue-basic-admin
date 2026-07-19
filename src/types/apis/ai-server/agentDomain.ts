import type {NameValueEnumMetadata, VersionEntityMetadata} from '@/types/apis'
import type {RoleType} from "@antdv-next/x/dist/bubble/interface";

/**
 * Agent 工作空间（对齐 `AgentWorkspaceEntity`）
 *
 * @author maurice.chen
 */
export interface AgentWorkspaceEntity extends VersionEntityMetadata {
  name: string
  tenantId?: string
  principal?: string
  operateCategory:NameValueEnumMetadata<number> | number
}

export interface AgentWorkspaceResponseBody extends AgentWorkspaceEntity {
  conversations?: AgentConversationEntity[]
}

/**
 * Agent 对话（对齐 `AgentConversationEntity`）
 *
 * @author maurice.chen
 */
export interface AgentConversationEntity extends VersionEntityMetadata {
  name?: string
  agentWorkspaceId?: number
  status?: number
  principal?: string
  tenantId?: string
}

/**
 * Agent 消息（对齐 `AgentMessageEntity`）
 *
 * @author maurice.chen
 */
export interface AgentMessageEntity extends VersionEntityMetadata {
  role: RoleType
  agentConversationId: number
  content?: string
  media?: string
  metadata?: string
  principal?: string
  tenantId?: string
}
