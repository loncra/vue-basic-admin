import type {NameValueEnumMetadata} from "@/types/apis";
import type {BaseChatBubble} from "@/types/composables";

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
  modelId?: number
  media?: string
  metadata?: string
  principal?: string
  tenantId?: string
}
