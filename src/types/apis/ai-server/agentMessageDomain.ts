import type {VersionEntityMetadata} from "@/types/apis";
import type {ChatBubbleType, ChatContentBlock} from "@/types/composables";

/**
 * Agent 消息（对齐 `AgentMessageEntity`）
 *
 * @author maurice.chen
 */
export interface AgentMessageEntity extends VersionEntityMetadata {
  role: ChatBubbleType
  agentConversationId: number
  content?: ChatContentBlock[]
  media?: string
  metadata?: string
  principal?: string
  tenantId?: string
}
