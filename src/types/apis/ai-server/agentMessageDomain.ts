import type {ModelSettingMetadata, NameValueEnumMetadata} from "@/types/apis";
import type {BaseChatBubble} from "@/types/composables";
import type {AbstractXRequestClass, SSEOutput} from "@antdv-next/x-sdk";

/**
 * Agent 消息（对齐 `AgentMessageEntity`）
 *
 * @author maurice.chen
 */
export interface AgentMessageEntity extends BaseChatBubble {
  role: NameValueEnumMetadata<string> | string
  agentConversationId: number
  status: NameValueEnumMetadata<number> | number
  parentId?: number
  model: ModelSettingMetadata
  type: NameValueEnumMetadata<number> | number
  media?: string
  metadata?: Record<string, unknown>
  principal?: string
  tenantId?: string
}

export interface StreamAgentMessageEntity extends AgentMessageEntity {
  stream?: AbstractXRequestClass<Record<string, never>, SSEOutput>
  copy?:boolean
  reedit?:boolean
}
