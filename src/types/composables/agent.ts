import type {
  AgentConversationEntity,
  AgentMessageEntity,
  ObjectWriteResult,
  PageResult
} from "@/types/apis";
import type {ChatContentBlock} from "@/types/composables/chat.ts";
import type {Ref} from "vue";


export interface AgentConversationItem extends AgentConversationEntity {
  editing: boolean
}

export interface ActiveAgentConversationItem extends AgentConversationItem {
  dataSource:PageResult<AgentMessageEntity>
  loading:boolean,
}

export interface AgentChatContext {
  conversationActive:Ref<ActiveAgentConversationItem | undefined>,
  activateConversation:(conversation: AgentConversationItem | undefined,messageId?:number) => void
}

export interface ProvideAgentChatContextOptions {

}

export interface AgentSenderFormProps {
  /**
   * 模型设置 id
   */
  modelId?: number;

  /**
   * 应答类型:10.ask,20.plan,30.agent
   */
  type?: number;

  /**
   * 消息词槽格式内容
   */
  content: ChatContentBlock[];

  /**
   * 附件媒体内容
   */
  attachment?: ObjectWriteResult[];

  /**
   * 附加 元数据内容
   */
  metadata?: Record<string, unknown>;
}

export interface AgentChatRequestBody extends AgentSenderFormProps {
  /**
   * 会话 id
   */
  agentConversationId?: number;
}

export interface AgentChatResponseBody {
  conversation: AgentConversationEntity
  userMessageId:number
}

export interface AgentSenderProps {
  onSubmit: (data: AgentSenderFormProps) => void;
}
