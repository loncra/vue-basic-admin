import type {AgentConversationEntity, ObjectWriteResult, PageResult} from "@/types/apis";
import type {ChatBubbleItem, ChatContentBlock} from "@/types/composables/chat.ts";
import type {Ref} from "vue";
import {AGENT_CHAT_STATUS} from "@/constants";


export interface AgentConversationItem extends AgentConversationEntity {
  editing: boolean
}

export interface ActiveAgentConversationItem extends AgentConversationItem {
  dataSource:PageResult<ChatBubbleItem>
  // 是否已加载出首页
  isOnFirstPage?:boolean
  // 是否已加载出尾页
  isOnLastPage?:boolean
  loading:boolean
}

export interface AgentChatContext {
  conversationActive:Ref<ActiveAgentConversationItem | undefined>
  conversations:Ref<AgentConversationItem[]>
  activateConversation:(conversation: AgentConversationItem | undefined,messageId?:number) => void
}

export type AgentChatStatus = (typeof AGENT_CHAT_STATUS)[keyof typeof AGENT_CHAT_STATUS]

export interface ProvideAgentChatContextOptions {
  view: Ref<AgentViewController | undefined>
}

export interface AgentViewController {

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
